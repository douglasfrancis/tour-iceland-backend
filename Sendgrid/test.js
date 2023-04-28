
const sgMail = require('@sendgrid/mail')
require('dotenv').config()

sgMail.setApiKey(process.env.SENDGRID_API_KEY)
const msg = {
  to: 'dougiefrancis@gmail.com', // Change to your recipient
  from: {
    email: 'tour-iceland@frantech.org.uk',
    name: 'Tour Iceland'
  },
  subject: 'Welcome to Tour Iceland',
  text: 'and easy to do anywhere, even with Node.js',
  html: '<strong>and easy to do anywhere, even with Node.js</strong>',
}
sgMail
  .send(msg)
  .then(() => {
    console.log('Email sent')
  })
  .catch((error) => {
    console.error(error)
  })