const AWS = require("aws-sdk");
const dynamoDB = new AWS.DynamoDB({ region: "us-east-1" });

const createTableIfNotExists = async (tableName) => {
  try {
    const tableDescription = await dynamoDB
      .describeTable({ TableName: tableName })
      .promise();
    console.log("Table already exists:", tableDescription);
  } catch (error) {
    if (error.code === "ResourceNotFoundException") {
      // Table does not exist, create it
      const createTableParams = {
        AttributeDefinitions: [
          {
            AttributeName: "user-key",
            AttributeType: "S",
          },
        ],
        KeySchema: [
          {
            AttributeName: "user-key",
            KeyType: "HASH",
          },
        ],
        // BillingMode: "PAY_PER_REQUEST",
        // if provisioned specify read and write
        BillingMode: "PROVISIONED",
        ProvisionedThroughput: {
          ReadCapacityUnits: 1,
          WriteCapacityUnits: 1,
        },
        TableName: tableName,
      };

      try {
        const createTableResponse = await dynamoDB
          .createTable(createTableParams)
          .promise();
        console.log("Table created:", createTableResponse);
      } catch (error) {
        console.error("Error creating table:", error);
      }
    } else {
      console.error("Error describing table:", error);
    }
  }
};

//   createTableIfNotExists();

// dynamoDB
//   .createTable({
//     AttributeDefinitions: [
//       {
//         AttributeName: "id",
//         AttributeType: "S",
//       },
//     ],
//     KeySchema: [
//       {
//         AttributeName: "id",
//         KeyType: "HASH",
//       },
//     ],
//     BillingMode: "PAY_PER_REQUEST",
//     TableName: "my-table",
//   })
//   .promise()
//   .then(data => console.log("Success!", data))
//   .catch(console.error)
