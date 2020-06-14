const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1. Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    // Activate in Gmail "less secure app" option
  });

  // 2. Define the Email options
  const mailOptions = {
    from: 'Quang Bui <hello1@jonas.io>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html
  };

  // 3. Actually send the Email with Nodemailer
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
