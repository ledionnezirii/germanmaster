require("dotenv").config(); // sigurohu që lexon variablat nga .env
const nodemailer = require("nodemailer");

const sendTest = async () => {
  console.log("Leximi i variablave nga .env:");
  console.log("EMAIL_HOST:", process.env.EMAIL_HOST);
  console.log("EMAIL_PORT:", process.env.EMAIL_PORT);
  console.log("EMAIL_USER:", process.env.EMAIL_USER);
  console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "💚 set" : "❌ missing");

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // përdor true me port 465 nëse do
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"Test App" <${process.env.EMAIL_USER}>`,
      to: "ledioon.2022@gmail.com", // vendos email-in tënd personal për test
      subject: "Test Email nga Render",
      html: "<h1>Email Test</h1><p>Kjo është një test nga serveri në Render</p>",
    });
    console.log("Email i dërguar me sukses:", info.messageId);
  } catch (error) {
    console.error("Gabim në dërgimin e email:", error);
    if (error.response) console.error("Response:", error.response);
  }
};

sendTest();
