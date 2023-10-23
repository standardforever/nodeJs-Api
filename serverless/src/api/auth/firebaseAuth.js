const express = require("express");
const jwt = require("jsonwebtoken");
const authenticateToken = require("../../utils/firebaseAuthenticate");
const { getUserByEmail } = require("../../utils/get_user");
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

// Register endpoint using firebase
app.get(
  "/api/firebase-google",
  authenticateToken,
  asyncHandler(async (req, res) => {
    try {
      // // Check if the email already exists in DynamoDB
      const userExists = await getUserByEmail(req.user.email);
      if (userExists) {
        // Generate a JWT token
        const token = jwt.sign(
          { email: req.user.email },
          process.env.JWT_SECRET,
          { expiresIn: "4h" }
        );

        return res.json({
          message: "Login successful",
          token,
          id: userExists["user-key"],
        });
      }
      // Prepare the item to be stored in DynamoDB
      const params = {
        TableName: "user",
        Item: {
          "user-key": req.user.user_id,
          email: req.user.email,
          name: req.user.name,
          isExpert: true,
          verified: true,
        },
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
      await dynamodbClinet.put(params).promise();

      // Generate a JWT token
      const token = jwt.sign(
        { email: req.user.email },
        process.env.JWT_SECRET,
        { expiresIn: "4h" }
      );
      return res.json({
        message: "Login successfull",
        token,
        id: req.user.user_id,
      });
    } catch (error) {
      console.error("Error registering user:", error);
      res.status(400).json({ message: "Error registering user" });
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
