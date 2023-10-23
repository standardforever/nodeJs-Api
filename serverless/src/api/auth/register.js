const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const uuid = require("uuid");
const { getUserByEmail } = require("../../utils/get_user");
// const { sendEmail } = require("../../utils/send_email");
const asyncHandler = require("express-async-handler");
require("dotenv").config();
const AWS = require("aws-sdk");
const { sendVerification } = require("../../utils/emailVerification")

const app = express();
app.use(express.json());

app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  next();
});

// Register endpoint
app.post(
  "/api/register",
  asyncHandler(async (req, res) => {
    try {
      const {
        email,
        password,
        confirmPassword,
        firstName,
        lastName,
        isExpert,
      } = req.body;

      // Put the item into DynamoDB
      AWS.config.update({
        accessKeyId: process.env.AWSS_ACCESS_KEY,
        secretAccessKey: process.env.AWSS_SECRET_KEY,
        region: process.env.REGION,
      });

      // Validate password and confirmPassword
      if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }

      // // Check if the email already exists in DynamoDB
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
          await dynamodbClinet.update(updateParams).promise();
          // Generate a JWT token
          const jwtToken = jwt.sign({ email: email }, process.env.JWT_SECRET, {
            expiresIn: "4h",
          });

          return res.status(201).json({
            message: "Registration successful please check email to verify",
            token: jwtToken,
          });
      };

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      const id = uuid.v4();
      const status = await sendVerification(email);

      if (status.response == true) {
        // Prepare the item to be stored in DynamoDB
        const params = {
          TableName: "user",
          Item: {
            "user-key": id,
            email: email,
            password: hashedPassword,
            verified: false,
            verificationCode: status.code,
            resetToken: false,
            tokenTime: status.time,
            firstName: firstName,
            lastName: lastName,
            isExpert: isExpert,
          },
        };
        
        const dynamodbClinet = new AWS.DynamoDB.DocumentClient({
          region: "us-east-1",
        });
        await dynamodbClinet.put(params).promise();
        if (isExpert == true) {
          //adding id to professional info table
          const professionalInfoParams = {
            TableName: "professionalInfo",
            Item: {
              "user-key": id,
            },
          };
          await dynamodbClinet.put(professionalInfoParams).promise();
        } else {
            const personalInfoParams = {
              TableName: "personalInfo",
              Item: {
                "user-key": id,
              },
            };
            await dynamodbClinet.put(personalInfoParams).promise();
        }
        const professionalInfoParams = {
          TableName: "bankDetails",
          Item: {
            "user-key": id,
          },
        };
        await dynamodbClinet.put(professionalInfoParams).promise(); 
        
      } else {
        return res.status(400).json({ message: "Error registering user" });
      }

      // Generate a JWT token
      const jwtToken = jwt.sign({ email: email }, process.env.JWT_SECRET, {
        expiresIn: "4h",
      });

      return res.status(201).json({
        message: "Registration successful please check email to verify",
        token: jwtToken,
      });
    } catch (error) {
      console.error("Error registering user:", error);
      res.status(400).json({ message: "Error registering user" });
    }
  })
);

// module.exports = app

// Lambda handler function
module.exports.handler = async (event, context, callback) => {
  const serverlessExpress = require("aws-serverless-express");
  if (event.source === "serverless-plugin-warmup") {
    console.log("WarmUP - Lambda is warm!");
    return callback(null, "Lambda is warm!");
  }
  const server = serverlessExpress.createServer(app);

  return serverlessExpress.proxy(server, event, context, "PROMISE").promise;
};
