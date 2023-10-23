const app = require('./serverless/src/api/stripe/createProduct');

// (async () => {
//   const yes = await confirmVerification("550743", "standard.forever123@gmail.com");
//   console.log(yes);
// })();

// sendVerification("standard.forever123@gmail.com")
// // Start the server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});





