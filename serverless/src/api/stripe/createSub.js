require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_API_KEY);


const express = require("express");
const authenticate = require("../../utils/authenticate");
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



// Create a subscription
app.post("/api/create-sub", asyncHandler(async (req, res) => {
    try {
      const subscription = await stripe.subscriptions.create({
        customer: req.body.customerId,
        items: [{
          plan: req.body.planId
        }]
      });
  
      res.json({ subscription: subscription, success: true });
    } catch (error) {
      res.status(500).json({ error: "An error occurred. Please try again." });
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
      