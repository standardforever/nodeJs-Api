const asyncHandler = require("express-async-handler");
const express = require('express');
const { getUserById,getUserByEmail } = require('../../utils/get_user');
const bcrypt = require('bcrypt');
require("dotenv").config();
const AWS = require('aws-sdk');
const { confirmVerification } = require("../../utils/emailVerification")

const app = express();
app.use(express.json());


app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader('Access-Control-Allow-Methods', '*');
  res.setHeader("Access-Control-Allow-Headers", "*");
  next();
});


app.post('/api/reset-token', asyncHandler(async (req, res) => {
  try {
        const { password, confirmPassword, otp, email } = req.body;
        const token = otp;
        // Validate password and confirmPassword
        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        };

        // check if the user id is valid
        const user =  await getUserByEmail(email);
  
        if (!user) return res.status(400).send("Invalid link");

        // Check if the token is valid
        // if (req.params.token != user.tokens) return res.status(400).send("Invalid link");
        const status = await confirmVerification(token, user.tokens, user.email, email, user.tokenTime);
  
        if (!status) return res.status(400).send("Invalid code or expired");


        if (!user.resetToken) return res.status(400).json({error: "invalid token"})

        const hashedPassword = await bcrypt.hash(password, 10);
        // Update the Record and set 'verified' to true
        const updateParams = {
          TableName: 'user',
          Key: { 'user-key': user['user-key'] },
          UpdateExpression: 'SET resetToken = :resetToken, password = :password',
          ExpressionAttributeValues: { 
            ':resetToken': false,
            ':password': hashedPassword
         },
        };

        AWS.config.update({
          accessKeyId: process.env.AWSS_ACCESS_KEY,
          secretAccessKey: process.env.AWSS_SECRET_KEY,
          region: process.env.REGION
        });
        const dynamodbClinet = new AWS.DynamoDB.DocumentClient({ region: "us-east-1" })
        await dynamodbClinet.update(updateParams).promise();
        res.send("reset password sucessfully");
  } catch (error) {
    console.log(error)
    res.status(400).send("Unable to verify token");
  }
}));



module.exports = app

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