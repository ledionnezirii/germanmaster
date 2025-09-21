const nodemailer = require("nodemailer")

const sendEmail = async (options) => {
  try {
    // Create a transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,       // e.g. smtp.gmail.com
      port: process.env.EMAIL_PORT,       // e.g. 587
      secure: false,                      // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,     // your email
        pass: process.env.EMAIL_PASS,     // your app password from Gmail
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
    const info = await transporter.sendMail(mailOptions)
    console.log("Email dërguar: %s", info.messageId)
  } catch (error) {
    console.error("Gabim gjatë dërgimit të email-it:", error)
    throw new Error("Gabim gjatë dërgimit të email-it") // ose ApiError nëse ke
  }
}

module.exports = sendEmail
