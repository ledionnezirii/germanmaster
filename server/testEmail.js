require("dotenv").config();
const sendEmail = require("./utils/sendEmail");

async function testEmail() {
  try {
    await sendEmail({
      email: "ledion.678@gmail.com", // you can test sending to yourself
      subject: "Test Email",
      message: "<h1>Hello!</h1><p>This is a test email.</p>",
    });
    console.log("Email sent successfully!");
  } catch (err) {
    console.error("Error sending email:", err);
  }
}

testEmail();
