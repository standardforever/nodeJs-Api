const { getUserByEmail } = require('../../utils/get_user')
const express = require('express');
const uuid = require('uuid');
const asyncHandler = require("express-async-handler");
const { sendEmail } = require('../../utils/send_email');
require("dotenv").config();
const AWS = require('aws-sdk');
const { sendVerification } = require("../../utils/emailVerification")

const app = express();
app.use(express.json());

app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader('Access-Control-Allow-Methods', '*');
  res.setHeader("Access-Control-Allow-Headers", "*");
  next();
});


app.post('/api/forget-password', asyncHandler(async (req, res) => {
    const { email } = req.body;
  
    try {
      // Check if the user exists
      const user = await getUserByEmail(email);

      if (!user) {
        return res.status(400).send('User not found');
      }
  
      // Generate a password reset token
      // const token = uuid.v4();
      const status = await sendVerification(email);
      // Store the token in the user's record
      const updateParams = {
        TableName: 'user',
        Key: { 'user-key': user['user-key'] },
        UpdateExpression: 'SET resetToken = :resetToken, tokens = :tokens, tokenTime= :tokenTime',
        ExpressionAttributeValues: { 
            ':tokens': status.code,
            ':resetToken': true,
            ':tokenTime': status.time
         },
      };

      AWS.config.update({
        accessKeyId: process.env.AWSS_ACCESS_KEY,
        secretAccessKey: process.env.AWSS_SECRET_KEY,
        region: process.env.REGION
      });
      const dynamodbClinet = new AWS.DynamoDB.DocumentClient({ region: "us-east-1" })
      await dynamodbClinet.update(updateParams).promise();

      res.send('Password reset instructions sent to your email');
    } catch (error) {
      console.error('Error processing forgot password request:', error);
      res.status(400).send('Unable to process the request');
    }
  }));
  

// module.exports = app

// Lambda handler function
module.exports.handler = async (event, context, callback) => {
  const serverlessExpress = require('aws-serverless-express');
  if (event.source === "serverless-plugin-warmup") {
    console.log("WarmUP - Lambda is warm!");
    return callback(null, "Lambda is warm!");
  }
  const server = serverlessExpress.createServer(app);

  return serverlessExpress.proxy(server, event, context, 'PROMISE').promise;
}; 
    