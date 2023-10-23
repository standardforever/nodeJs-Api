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

// personal info
app.put("/api/professional-info", authenticate, asyncHandler(async (req, res) => {
    try {
      const data = req.body;

      // Prepare the item to be updated in DynamoDB
      let updateExpression = "SET";
      let ExpressionAttributeValues = {};
      for (const property in data) {
        updateExpression += ` ${property} = :${property} ,`;
        ExpressionAttributeValues[":" + property] = data[property];
      }

      //  Remove the trailing comma from UpdateExpression if any fields were added
      updateExpression = updateExpression.slice(0, -1);

      const updateParams = {
        TableName: "user",
        Key: { "user-key": req.user_id},
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: ExpressionAttributeValues,
      };

      // Put the item into DynamoDB
      AWS.config.update({
        accessKeyId: process.env.AWSS_ACCESS_KEY,
        secretAccessKey: process.env.AWSS_SECRET_KEY,
        region: process.env.REGION,
      });
      const dynamodbClinet = new AWS.DynamoDB.DocumentClient({
        region: "us-east-1",
      });
      await dynamodbClinet.update(updateParams).promise();

      return res.json({
        message: "User Professsional Info Added Successfully",
        id: req.user_id,
      });
    } catch (error) {
      console.error("Error while Adding user professional info:", error);
      res
        .status(400)
        .json({ message: "Error while Adding user professional info" });
    }
  })
);

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
