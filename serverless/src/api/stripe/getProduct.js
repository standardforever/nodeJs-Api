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

function formatUSD(stripeAmount) {
    return `$${(stripeAmount / 100).toFixed(2)}`;
  }
  
  function formatStripeAmount(USDString) {
    return parseFloat(USDString) * 100;
  }

app.get("/api/product-details",  asyncHandler(async (req, res) => {

  Promise.all([
    stripe.products.list({}),
    stripe.plans.list({})
  ]).then(([productsData, plansData]) => {
    const products = productsData.data;
    let plans = plansData.data;

    plans = plans.sort((a, b) => {
      /* Sort plans in ascending order of price (amount) */
      return a.amount - b.amount;
    }).map(plan => {
      /* Format plan price (amount) */
      amount = formatUSD(plan.amount);
      return { ...plan, amount };
    });

    products.forEach(product => {
      const filteredPlans = plans.filter(plan => {
        return plan.product === product.id;
      });

      product.plans = filteredPlans;
    });

    const filteredProducts = products.filter(product => {
      return product.plans.length > 0;
    });

    res.json({ products: filteredProducts });
  }).catch(err => {
    res.status(500).json({ error: "an error occure try again" });
  });
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
      