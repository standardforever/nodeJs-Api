const express = require("express");
const axios = require("axios");
const app = express();
const asyncHandler = require("express-async-handler");
const authenticate = require("../../utils/authenticate");
const AWS = require("aws-sdk");
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

app.post(
  "/api/verify-answers2",
  authenticate,
  asyncHandler(async (req, res) => {
    try {
      const currentDate = new Date();

      AWS.config.update({
        accessKeyId: process.env.AWSS_ACCESS_KEY,
        secretAccessKey: process.env.AWSS_SECRET_KEY,
        region: process.env.REGION,
      });

      const dynamodbClient = new AWS.DynamoDB.DocumentClient({
        region: "us-east-1",
      });

      const queryParams = {
        TableName: "user",
        Key: { "user-key": req.user_id },
      };

      const queryResult = await dynamodbClient.get(queryParams).promise();

      const userData = queryResult.Item;

      if (userData && userData.correctAnswer && userData.testDate) {
        const previousScore = userData.correctAnswer;
        const previousTestDate = new Date(userData.testDate);

        const elapsedTime = currentDate.getTime() - previousTestDate.getTime();
        const elapsedMonths = Math.floor(elapsedTime / (1000 * 3600 * 24 * 30));

        if (previousScore < 35 && elapsedMonths < 3) {
          const remainingMonths = 3 - elapsedMonths;
          return res
            .status(400)
            .json({
              message: `You are not eligible to retake the test. Please come back in ${remainingMonths} month(s) to complete the 3-month waiting period.`,
            });
        }
      } else if (userData) {
        return res
          .status(400)
          .json({ message: "You have takening these test already" });
      }

      const answerData = req.body.answer;
      const questionIds = answerData.map((answer) => answer.id);

      // Fetch the questions based on the provided IDs
      const questionsResponse = await axios.get(url, {
        params: {
          "fields[0]": "question",
          "fields[1]": "answer",
          "populate[consultant_category][fields][0]": "category",
          "filters[id][$in]": questionIds,
          "pagination[page]": 1,
          "pagination[pageSize]": 30,
        },
      });

      const questionData = questionsResponse.data.data;
      const questionsMap = questionData.reduce((map, question) => {
        map[question.id] = question.attributes.answer.toLowerCase().trim();
        return map;
      }, {});

      const totalAnswers = 25; // Total number of questions/answers

      let totalCorrectAnswers = 0;

      for (const answer of answerData) {
        const { id, answer: userAnswer, category } = answer;
        const correctAnswer = questionsMap[id];

        if (correctAnswer && correctAnswer == userAnswer.toLowerCase().trim()) {
          totalCorrectAnswers++;
        }
      }

      if (answerData.length < totalAnswers) {
        return res
          .status(400)
          .json({
            error: "Invalid number of answers. Please provide all 25 answers.",
          });
      }

      const percentage = (totalCorrectAnswers / totalAnswers) * 100;

      const updateParams = {
        TableName: "user",
        Key: { "user-key": req.user_id },
        UpdateExpression:
          "SET correctAnswer = :correctAnswer, testDate = :testDate",
        ExpressionAttributeValues: {
          ":correctAnswer": percentage,
          ":testDate": currentDate.toISOString(),
        },
      };

      // Put the item into DynamoDB
      await dynamodbClient.update(updateParams).promise();

      let message = "Expert is eligible to create consultation";
      if (percentage < 35) {
        message =
          "Expert is not eligible to create consultation. Please try again after 3 months.";
      }

      res.json({
        percentage: percentage,
        totalCorrectAnswers: totalCorrectAnswers,
        message: message,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  })
);

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
