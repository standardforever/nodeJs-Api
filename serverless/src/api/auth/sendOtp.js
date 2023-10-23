const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { getUserByEmail } = require("../../utils/get_user");
const asyncHandler = require("express-async-handler");
const AWS = require("aws-sdk");
require("dotenv").config();

const { sendVerification } = require("../../utils/emailVerification")

const app = express();
app.use(express.json());

app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  next();
});




app.post("/api/send-otp", asyncHandler(async (req, res) => {
      try {
        const { email } = req.body;
        // Check if the email already exists in DynamoDB
        const userExists = await getUserByEmail(email);

        if (userExists && userExists.verified == true) {
            return res.status(409).json({ message: "Email already registered" });
        } else if (userExists && userExists.verified == false) {
            // check if the user exit and not verify send new token
            const status = await sendVerification(email);
            const updateParams = {
            TableName: 'user',
            Key: { 'user-key': userExists['user-key'] },
            UpdateExpression: 'SET verificationCode = :verificationCode, tokenTime = :tokenTime',
            ExpressionAttributeValues: { ':verificationCode':  status.code, ":tokenTime": status.time},
            };

            const dynamodbClinet = new AWS.DynamoDB.DocumentClient({ region: "us-east-1" })
            const news  = await dynamodbClinet.update(updateParams).promise();

            // Generate a JWT token
            const jwtToken = jwt.sign({ email: email }, process.env.JWT_SECRET, {
            expiresIn: "4h",
            });
                return res.status(201).json({
                    token: jwtToken,
            });
        } else {
            return res.status(401).json({error: "user is not registered"});
        }
    } catch (error) {
        console.log(error)
        return res.status(500).json({error: "something happend try again"});
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
      