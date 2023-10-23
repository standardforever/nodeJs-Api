const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const { getUserByEmail } = require("./get_user");
require("dotenv").config();

// password authentication
const authenticate = asyncHandler(async (req, res, next) => {
  // Check if token is present in the header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from headers
      const token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decode = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decode;
      // // Check if the user exists in DynamoDB
      const userExists = await getUserByEmail(req.user.email);
      // const userMatched =
      //   userExists && userExists["user-key"] === req.params.id;
      if (!userExists) {
        // return
        return res.status(400).json({
          message: "user not found",
        });
      }
      req.user_id = userExists["user-key"];

      next();
    } catch (error) {
      console.log(error);
      res.status(401).json({ error: "Unauthorize" });
    }
  } else {
    res.status(401).json({ error: "Unauthorize" });
  }
});

module.exports = authenticate;
