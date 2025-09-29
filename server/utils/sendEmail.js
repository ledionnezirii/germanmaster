const sgMail = require("@sendgrid/mail");

// Set the API Key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (options) => {
  try {
    const msg = {
      to: options.email, // recipient
      from: process.env.EMAIL_FROM, // must be verified in SendGrid
      subject: options.subject,
      html: options.message,
    };

    await sgMail.send(msg);
    console.log("✅ Email sent to:", options.email);
  } catch (error) {
    console.error("❌ Error sending email:", error.response?.body || error);
    throw new Error("Gabim gjatë dërgimit të email-it");
  }
};

module.exports = sendEmail;
