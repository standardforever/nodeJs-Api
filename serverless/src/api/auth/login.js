const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { getUserByEmail } = require("../../utils/get_user");
const asyncHandler = require("express-async-handler");
require("dotenv").config();

const app = express();
app.use(express.json());

app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  next();
});

// Login endpoint
app.post(
  "/api/login",
  asyncHandler(async (req, res) => {
    try {
      const { email, password } = req.body;

      // Retrieve the user from DynamoDB
      const user = await getUserByEmail(email);

      // Check if the user exists
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Compare the password with the hashed password
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Check if the user is verified
      // if (!user.verified) {
      //   return res.status(403).json({ message: 'Email not verified' });
      // }

      // Generate a JWT token
      const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
        expiresIn: "4h",
      });

      res.json({ message: "Login successful", token, id: user["user-key"], verify: user.verified });
    } catch (error) {
      console.error("Error logging in:", error);
      res.status(500).json({ message: "Error logging in" });
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
