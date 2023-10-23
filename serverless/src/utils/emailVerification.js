require("dotenv").config();
// const accountSid = process.env.TWILIO_SID;
// const authToken = process.env.TWILIO_TOKEN;
// const PHONE_NUMBER = process.env.PHONE_NUMBER
// const VERIFICATION_SID = process.env.VERIFICATION_SID
// const client = require('twilio')(accountSid, authToken);
const asyncHandler = require("express-async-handler");
const {sendEmail } = require('./send_email')
const moment = require('moment');

/**
 * sendVrifcation - it send verification code to user
 * @to_email : email to send the message to
 */
 exports.sendVerification = asyncHandler(async (to_email) => {
   // Generate a verification code
   let randomNumber = '';
   for (let i = 0; i < 6; i++) {
     const digit = Math.floor(Math.random() * 10) + 1;
     randomNumber += digit;
   }
   const token = randomNumber;
   const currentTime = moment().toISOString(); // Get current time in ISO format
 
   // Send verification email
   const response = await sendEmail(
     to_email,
     'Email verification',
     `<h1>Thanks</h1><p>This is your verification code: <b>${token}</b></p>`
   );
   
   return {
     response: response,
     code: randomNumber,
     time: currentTime
   };
 });

 
/**
 * confirmVrifcation - it verifies the code
 * @to_number : phonNumber to send the message to
 * @code : The code send by sendVerification
 */ 
 exports.confirmVerification = (code, verify_code, to_email, verify_email, time) => {
      const currentTime = moment(); // Get current time
      const verificationTime = moment(time); // Parse the stored verification time
   
      if (to_email !== verify_email) return false;
   
      const duration = moment.duration(currentTime.diff(verificationTime)); // Calculate the time difference
      const minutesPassed = duration.asMinutes(); // Get the time difference in minutes
      
      if (minutesPassed > 2) {
        console.log(minutesPassed)
        return false; // Return false if more than one minute has passed
      }
    
      // Check if the provided code matches the expected code
      if (code == verify_code) {
        // Code is valid, proceed with verification
        // ...
        return true;
      } else {
        return false;
      }
   };