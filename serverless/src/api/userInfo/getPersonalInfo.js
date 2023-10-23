const express = require("express");
const authenticate = require("../../utils/authenticate");
const asyncHandler = require("express-async-handler");
require("dotenv").config();
const AWS = require("aws-sdk");
const { getUserById } = require("../../utils/get_user");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// to resolve cors issue
app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  next();
});

// personal info
app.get("/api/personal-info", authenticate, asyncHandler(async (req, res) => {
    try {
      const user = await getUserById(req.user_id);
      // Delete some sensitive information
      const propertiesToDelete = ['resetToken', 'password', 'verificationCode', 'tokens']
      propertiesToDelete.forEach((property) => {
        delete user[property]
      })

      return res.json({
        data: user,
      });
    } catch (error) {
      console.error("Error while Fetching user info:", error);
      res.status(400).json({ message: "Error while Fetching user info" });
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
