const SibApiV3Sdk = require('@sendinblue/client');
require('dotenv').config();

// Initialize client
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKeyAuth = defaultClient.authentications['api-key'];
apiKeyAuth.apiKey = process.env.BREVO_API_KEY;

const client = new SibApiV3Sdk.TransactionalEmailsApi();

const sendEmail = async ({ to, subject, htmlContent }) => {
  const emailData = new SibApiV3Sdk.SendSmtpEmail({
    sender: { email: process.env.EMAIL_FROM, name: "GjuhëGjerma App" },
    to: [{ email: to, name: "User" }],
    subject,
    htmlContent,
  });

  try {
    const res = await client.sendTransacEmail(emailData);
    console.log("✅ Email sent:", res.body.messageId);
    return res.body;
  } catch (err) {
    console.error("❌ Error sending email:", err.response?.body || err);
    throw new Error("Gabim gjatë dërgimit të email-it");
  }
};

module.exports = sendEmail;
