require('dotenv').config();
const SibApiV3Sdk = require('@sendinblue/client');

const client = new SibApiV3Sdk.TransactionalEmailsApi();

// Set API key using the new SDK method
client.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

const sendEmail = async ({ email, subject, htmlContent }) => {
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail({
    sender: { email: process.env.EMAIL_FROM, name: "GjuhëGjerma App" },
    to: [{ email, name: "User" }],
    subject,
    htmlContent,
  });

  try {
    const result = await client.sendTransacEmail(sendSmtpEmail);
    console.log("✅ Email sent to:", email);
    console.log(result);
  } catch (error) {
    console.error("❌ Error sending email:", error);
  }
};

module.exports = sendEmail;
