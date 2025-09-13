const nodemailer = require("nodemailer")

const sendEmail = async (options) => {
  // Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,       // e.g. smtp.gmail.com
    port: process.env.EMAIL_PORT,       // e.g. 587
    secure: false,                      // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,     // your email
      pass: process.env.EMAIL_PASS,     // your email password or app password
    },
  })

  // Define email options
  const mailOptions = {
    from: `"German Learning App" <${process.env.EMAIL_USER}>`, // sender
    to: options.email,               // receiver
    subject: options.subject,
    html: options.message,           // HTML email body
  }

  // Send the email
  await transporter.sendMail(mailOptions)
}

module.exports = sendEmail
