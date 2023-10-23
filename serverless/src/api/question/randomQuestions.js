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

const url = `${process.env.STRAPI_URL}consultant-q-as`;
const params = {
  "fields[0]": "question",
  "fields[1]": "answer",
  "populate[options]": "options",
  "populate[consultant_category][fields][0]": "category",
  "filters[consultant_category][category][$eq]": "Business Consultants",
  "pagination[page]": 1,
  "pagination[pageSize]": 30,
};

app.post(
  "/api/questions",
  authenticate,
  asyncHandler(async (req, res) => {
    try {
      const categories = req.body.categories.map((category) => category.trim()); // Trim white spaces from each category

      // Limit the number of categories to a minimum of 1 and a maximum of 3
      const limitedCategories = categories.slice(0, 3);

      // Array to store all the selected questions
      let selectedQuestions = [];

      for (const category of limitedCategories) {
        // Set the category filter dynamically based on the current category
        const categoryFilter = {
          "filters[consultant_category][category][$eq]": category,
        };

        // Make a request for each category
        const categoryResponse = await axios.get(url, {
          params: { ...params, ...categoryFilter },
        });

        const categoryQuestions = categoryResponse.data.data;

        // Add all questions from the current category to the selectedQuestions array
        selectedQuestions = selectedQuestions.concat(categoryQuestions);
      }

      // Randomly select 25 questions from the combined selected questions
      const shuffledQuestions = getRandomElements(selectedQuestions, 25);

      // Format the questions as required
      const formattedQuestions = shuffledQuestions.map((question) => {
        const { id, attributes } = question;
        const {
          question: questionText,
          options,
          consultant_category,
        } = attributes;
        const formattedOptions = options.map((option) => option.option);
        const category = consultant_category.data.attributes.category;

        return {
          id,
          question: questionText,
          options: formattedOptions,
          category,
        };
      });

      res.json(formattedQuestions);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  })
);

// Helper function to randomly select elements from an array
function getRandomElements(array, count) {
  const shuffled = array.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

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
