const express = require('express');
const app = express();

const ENDPOINT = 'ef5pey5k7c.execute-api.us-east-1.amazonaws.com/production';
const client = new AWS.ApiGatewayManagementApi({ endpoint: ENDPOINT });

const sendToOne = async (id, body) => {
  try {
    await client.postToConnection({
      ConnectionId: id,
      Data: Buffer.from(JSON.stringify(body)),
    }).promise();
  } catch (err) {
    console.error(err);
  }
};

const sendToAll = async (ids, body) => {
  const all = ids.map((i) => sendToOne(i, body));
  return Promise.all(all);
};

const NAMES_DB = {};

app.ws('/', (ws) => {
  ws.on('message', async (message) => {
    const { action, payload, meta } = JSON.parse(message);

    switch (action) {
      case '$connect':
        // Implement your logic for $connect
        break;
      case 'setName':
        // Implement your logic for setName
        break;
      case 'sendPublic':
        // Implement your logic for sendPublic
        break;
      case 'sendPrivate':
        // Implement your logic for sendPrivate
        break;
      case '$disconnect':
        // Implement your logic for $disconnect
        break;
      default:
        break;
    }
  });

  ws.on('close', () => {
    // Implement your logic for WebSocket connection close
  });
});

// Start the Express server
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});



import AWS from 'aws-sdk';
// // import { LambdaActions } from 'lambda-actions';
// let NAMES_DB = {};


// const ENDPOINT = 'ef5pey5k7c.execute-api.us-east-1.amazonaws.com/production';
// const client = new AWS.ApiGatewayManagementApi({ endpoint: ENDPOINT });

// const sendToOne = async (id, body) => {
//   try {
//     await client.postToConnection({
//       'ConnectionId': id,
//       'Data': Buffer.from(JSON.stringify(body)),
//     }).promise();
//   } catch (err) {
//     console.error(err);
//   }
// };

// const sendToAll = async (ids, body) => {
//   const all = ids.map(i => sendToOne(i, body));
//   return Promise.all(all);
// };

// export const $connect = async () => {
//   return {};
// };

// export const setName = async (payload, meta) => {
//   NAMES_DB[meta.connectionId] = payload.name;
//   await sendToAll(Object.keys(NAMES_DB), { members: Object.values(NAMES_DB) });
//   await sendToAll(Object.keys(NAMES_DB), { systemMessage: `${NAMES_DB[meta.connectionId]} has joined the chat` })
//   return {};
// };

// export const sendPublic = async (payload, meta) => {
//   await sendToAll(Object.keys(NAMES_DB), { publicMessage: `${NAMES_DB[meta.connectionId]}: ${payload.message}` })
//   return {};
// };

// export const sendPrivate = async (payload, meta) => {
//   const to = Object.keys(NAMES_DB).find(key => NAMES_DB[key] === payload.to);
//   await sendToOne(to, { privateMessage: `${NAMES_DB[meta.connectionId]}: ${payload.message}` });
//   return {};
// };

// export const $disconnect = async (payload, meta) => {
//   await sendToAll(Object.keys(NAMES_DB), { systemMessage: `${NAMES_DB[meta.connectionId]} has left the chat` })
//   delete NAMES_DB[meta.connectionId];
//   await sendToAll(Object.keys(NAMES_DB), { members: Object.values(NAMES_DB) })
//   return {};
// };

// export const handler = async (event, context) => {

//   if (!event.requestContext) {
//     return {};
//   }

//   try {

//     const connectionId = event.requestContext.connectionId;
//     const routeKey = event.requestContext.routeKey;
//     const body = JSON.parse(event.body || '{}');

//     const lambdaActions = new LambdaActions();
//     lambdaActions.action('$connect', $connect);
//     lambdaActions.action('$disconnect', $disconnect);
//     lambdaActions.action('setName', setName);
//     lambdaActions.action('sendPublic', sendPublic);
//     lambdaActions.action('sendPrivate', sendPrivate);

//     await lambdaActions.fire({
//       action: routeKey,
//       payload: body,
//       meta: { connectionId },
//     });

//   } catch (err) {
//     console.error(err);
//   }

//   return {};
// };