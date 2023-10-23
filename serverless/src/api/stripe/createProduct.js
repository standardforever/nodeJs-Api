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



// // Create a product
// app.post("/api/createProduct", asyncHandler(async (req, res) => {
//     try {
//       const product = await stripe.products.create({
//         name: req.body.name,
//         type: req.body.type,
//         description: req.body.description,
//         metadata: {
//           amount: req.body.amount,
//           time: req.body.time,
//           currency: req.body.currency
//         }
//       });
  
//       res.json({ product: product, success: true });
//     } catch (error) {
//       res.status(500).json({ error: "An error occurred. Please try again." });
//     }
//   }));


// Create a product with prices
app.post("/api/createProduct", asyncHandler(async (req, res) => {
    try {
      const product = await stripe.products.create({
        name: req.body.name,
        type: req.body.type,
        description: req.body.description
      });
  
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: req.body.amount,
        currency: req.body.currency,
        recurring: {
          interval: req.body.billing_period
        }
      });
  
      res.json({ product: product, price: price, success: true });
    } catch (error) {
      res.status(500).json({ error: "An error occurred. Please try again." });
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
      