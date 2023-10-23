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


// Retrieve a Subscription by Customer Email
app.post("/api/sub-by-email", asyncHandler(async (req, res) => {
    const customerEmail = req.body.email;
  
    if (!customerEmail) {
      // Retrieve all subscriptions
      stripe.subscriptions.list()
        .then(subscriptions => {
          res.json(subscriptions.data);
        })
        .catch(error => {
          res.status(500).json({ error: error.message });
        });
    } else {
      // Retrieve subscriptions by customer email
      stripe.customers.list({ email: customerEmail })
        .then(customers => {
          if (customers.data.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
          }
  
          const customerId = customers.data[0].id;
  
          stripe.subscriptions.list({ customer: customerId })
            .then(subscriptions => {
              res.json(subscriptions.data);
            })
            .catch(error => {
              res.status(500).json({ error: error.message });
            });
        })
        .catch(error => {
          res.status(500).json({ error: error.message });
        });
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
        
  