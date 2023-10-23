const AWS = require("aws-sdk");
require("dotenv").config();

AWS.config.update({
  accessKeyId: process.env.AWSS_ACCESS_KEY,
  secretAccessKey: process.env.AWSS_SECRET_KEY,
  region: process.env.REGION,
});
const dynamodbClinet = new AWS.DynamoDB.DocumentClient({ region: "us-east-1" });

// Helper function to get a user by email from DynamoDB
const getUserById = async (id, tableName) => {
  const params = {
    TableName: tableName ? tableName : "user",
    Key: {
      "user-key": id,
    },
  };

  try {
    const result = await dynamodbClinet.get(params).promise();
    return result.Item;
  } catch (error) {
    console.error("Error retrieving user:", error);
    throw error;
  }
};

const getUserByEmail = async (email) => {
  const params = {
    TableName: "user",
    FilterExpression: "attribute_exists(email) AND email = :email",
    ExpressionAttributeValues: {
      ":email": email,
    },
  };

  try {
    const result = await dynamodbClinet.scan(params).promise();
    return result.Items[0] || null;
  } catch (error) {
    console.error("Error scanning table:", error);
    throw error;
  }
};

module.exports = { getUserById, getUserByEmail };
