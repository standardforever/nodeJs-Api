const sgmail = require('@sendgrid/mail');
const { response } = require('express');
require("dotenv").config();



sgmail.setApiKey(process.env.SEND_GRID_KEY)


const sendEmail = async (to, subject, body) => {
    const message = {
      to: to,
      from: {
      name: "finest",
      email: "finest50.official@gmail.com",
    },
      subject: subject,
      html: body,
      // text: body,
    };
  
    try {
      await sgmail.send(message);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  };
  


module.exports = { sendEmail }