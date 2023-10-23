const express = require("express");
const authenticate = require("../../utils/authenticate");
const { getUserByEmail } = require("../../utils/get_user");
const asyncHandler = require("express-async-handler");
require("dotenv").config();

const app = express();
app.use(express.json());
// to resolve cors issue
app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  next();
});

// endpoint to check user is verified or not
app.get(
  "/api/check-verified/:id",
  authenticate,
  asyncHandler(async (req, res) => {
    try {
      // // Check if the user exists in DynamoDB
      const user = await getUserByEmail(req.user.email);
      if (!user) {
        return res.status(400).json({
          message: "User not exist",
        });
      }

      // Check if the user is verified
      return res.status(200).json({
        message: user?.verified ? "User is verified" : "User is not verified",
      });
    } catch (error) {
      console.error("Error while checking user verification:", error);
      res
        .status(400)
        .json({ message: "Error while checking user verification" });
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
