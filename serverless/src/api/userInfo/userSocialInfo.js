const express = require("express");
const authenticate = require("../../utils/authenticate");
const asyncHandler = require("express-async-handler");
require("dotenv").config();
const AWS = require("aws-sdk");

const app = express();
app.use(express.json());

// to resolve cors issue
app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  next();
});

app.put("/api/social-media-details", authenticate, asyncHandler(async (req, res) => {
    try {
      const userId = req.user_id;
      const socialMediaDetails = req.body;
  
      // Check if the item exists in DynamoDB
      const getItemParams = {
        TableName: "user_socialmedia_details",
        Key: { "user-key": userId },
      };
      // Configure the database
      AWS.config.update({
        accessKeyId: process.env.AWSS_ACCESS_KEY,
        secretAccessKey: process.env.AWSS_SECRET_KEY,
        region: process.env.REGION,
      });
    
      const dynamodb = new AWS.DynamoDB.DocumentClient({
        region: "us-east-1",
      });

      const existingItem = await dynamodb.get(getItemParams).promise();
      if (!existingItem.Item) {
        return res.status(404).json({ message: "User social media details not found" });
      }
  
      const updateExpression = [];
      const expressionAttributeValues = {};
  
      for (const field in socialMediaDetails) {
        if (existingItem.Item[field]) {
          // If the field already exists, append the new elements to the existing array
          updateExpression.push(`#${field} = list_append(#${field}, :${field})`);
          expressionAttributeValues[`:${field}`] = socialMediaDetails[field];
        } else {
          // If the field doesn't exist, set the entire array
          updateExpression.push(`#${field} = :${field}`);
          expressionAttributeValues[`:${field}`] = socialMediaDetails[field];
        }
      }
  
      const updateParams = {
        TableName: "user_socialmedia_details",
        Key: { "user-key": userId },
        UpdateExpression: `SET ${updateExpression.join(", ")}`,
        ExpressionAttributeNames: {
          ...Object.fromEntries(
            Object.keys(socialMediaDetails).map((field) => [`#${field}`, field])
          ),
        },
        ExpressionAttributeValues: expressionAttributeValues,
      };
  
      await dynamodb.update(updateParams).promise();
  
      console.log("User social media details updated successfully:", userId);
      res.json({ message: "User social media details updated successfully", userId });
    } catch (error) {
      console.error("Error while updating user social media details:", error);
      res.status(400).json({ message: "Error while updating user social media details" });
    }
  }));
  

// module.exports = app

module.exports.handler = async (event, context, callback) => {
    const serverlessExpress = require("aws-serverless-express");
    if (event.source === "serverless-plugin-warmup") {
      console.log("WarmUP - Lambda is warm!");
      return callback(null, "Lambda is warm!");
    }
    const server = serverlessExpress.createServer(app);
  
    return serverlessExpress.proxy(server, event, context, "PROMISE").promise;
  };
  