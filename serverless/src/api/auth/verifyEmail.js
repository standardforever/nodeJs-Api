const asyncHandler = require("express-async-handler");
const express = require('express');
require("dotenv").config();
const { getUserById } = require('../../utils/get_user');
const AWS = require('aws-sdk');
const authenticate = require('../../utils/authenticate')
const { confirmVerification } = require("../../utils/emailVerification")
const app = express();
app.use(express.json());


app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader('Access-Control-Allow-Methods', '*');
  res.setHeader("Access-Control-Allow-Headers", "*");
  next();
});


app.post('/api/verify-otp', authenticate, asyncHandler(async (req, res) => {
  try {
        // check if the user id is valid
        
        const user =  await getUserById(req.user_id);
        if (!user) return res.status(400).send("Invalid link");

        // Check if email is already verified
        if (user.verified == true) return res.status(400).send("User is already verified")

        // Check if the token is valid
        // if (req.body.token !== user.verificationCode) return res.status(400).send("Invalid code");

        const status = await confirmVerification(req.body.otp, user.verificationCode, req.user.email, user.email, user.tokenTime);
        if (!status) return res.status(400).send("Invalid code");
        
        // Update the Record and set 'verified' to true
        const updateParams = {
          TableName: 'user',
          Key: { 'user-key': req.user_id },
          UpdateExpression: 'SET verified = :verified',
          ExpressionAttributeValues: { ':verified': true },
        };

        AWS.config.update({
          accessKeyId: process.env.AWSS_ACCESS_KEY,
          secretAccessKey: process.env.AWSS_SECRET_KEY,
          region: process.env.REGION
        });

        const dynamodbClinet = new AWS.DynamoDB.DocumentClient({ region: "us-east-1" })
        await dynamodbClinet.update(updateParams).promise();
        res.send("email verified sucessfully");
  } catch (error) {
    console.log(error)
    res.status(400).send("Unable to verify the email");
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