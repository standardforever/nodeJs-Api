const express = require("express");
const axios = require("axios");
const app = express();
const asyncHandler = require("express-async-handler");
const authenticate = require("../../utils/authenticate");
require("dotenv").config();
app.use(express.json());
// to resolve cors issue
app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  next();
});

const url = `${process.env.STRAPI_URL}consultant-categories`;
const params = {
  "fields[0]": "category",
  "populate[sub_category][fields][0]": "sub_category",
};

app.get(
  "/api/categories-list",
  asyncHandler(async (req, res) => {
    try {
      const response = await axios.get(url, { params });
      const categoriesData = response.data.data;

      const formattedCategories = categoriesData.map((category) => {
        const subCategories = category.attributes.sub_category.map(
          (subCategory) => subCategory.sub_category
        );

        return {
          id: category.id,
          category: category.attributes.category,
          sub_category: subCategories,
        };
      });

      const formattedData = { data: formattedCategories };

      res.json(formattedData);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  })
);

module.exports = app;

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
