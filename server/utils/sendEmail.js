const SibApiV3Sdk = require('@sendinblue/client');
require('dotenv').config();

const client = new SibApiV3Sdk.TransactionalEmailsApi();
client.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

const sendEmail = async ({ to, subject, htmlContent }) => {
  const emailData = {
    sender: { email: process.env.EMAIL_FROM, name: "GjuhëGjerma App" },
    to: [{ email: to, name: "User" }],
    subject,
    htmlContent,
  };

  try {
    const res = await client.sendTransacEmail(emailData);
    console.log("✅ Email sent:", res.body.messageId);
    return res.body;
  } catch (err) {
    console.error("❌ Error sending email:", err.body || err);
    throw new Error("Gabim gjatë dërgimit të email-it");
  }
};

module.exports = sendEmail;
