const jwt = require("jsonwebtoken");
require("dotenv").config();
const admin = require("firebase-admin");
const serviceAccount = require("../api/auth/finest50.json");

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Middleware to verify the Firebase ID token
const authenticateToken = async (req, res, next) => {
  try {
    // Extract the token from the request header
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Missing authorization header" });
    }

    // Verify the token using the Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(token);
    // Attach the user information to the request object
    req.user = decodedToken;

    // Proceed to the next middleware or route
    next();
  } catch (error) {
    console.error("Error verifying Firebase ID token:", error);
    return res.status(403).json({ error: "Unauthorized" });
  }
};

module.exports = authenticateToken;
