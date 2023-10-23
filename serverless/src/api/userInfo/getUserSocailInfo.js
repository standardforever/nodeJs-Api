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


app.get("/api/social-media-details", authenticate, asyncHandler(async (req, res) => {
  try {
      AWS.config.update({
          accessKeyId: process.env.AWSS_ACCESS_KEY,
          secretAccessKey: process.env.AWSS_SECRET_KEY,
          region: process.env.REGION,
      });
      const dynamodbClinet = new AWS.DynamoDB.DocumentClient({ region: "us-east-1" });

      const queryFieldName = req.query.field;

      if (!queryFieldName) {
          // If no query parameter is provided, return the entire social media details object
          const params = {
              TableName: "user_socialmedia_details",
              Key: {
                  "user-key": req.user_id,
              },
          };
          const result = await dynamodbClinet.get(params).promise();
          return res.status(200).json({ message: result.Item });
      }

      // Query the DynamoDB table for the specified field
      const params = {
          TableName: "user_socialmedia_details",
          KeyConditionExpression: "#userKey = :userKey",
          ProjectionExpression: queryFieldName,
          ExpressionAttributeNames: {
              "#userKey": "user-key",
          },
          ExpressionAttributeValues: {
              ":userKey": req.user_id,
          },
      };
      const result = await dynamodbClinet.query(params).promise();

      if (result.Items.length === 0) {
          return res.status(404).json({ message: "Field not found" });
      }

      return res.status(200).json({ message: result.Items });
  } catch (error) {
      console.error("Error while getting user social media info:", error);
      res.status(400).json({ message: "Error while getting user social media detail" });
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
