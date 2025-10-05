require('dotenv').config({ path: './.env' }); // adjust path if needed
const SibApiV3Sdk = require('@sendinblue/client');

const client = new SibApiV3Sdk.TransactionalEmailsApi();
client.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

const sendEmail = async () => {
  const emailData = {
    sender: { email: process.env.EMAIL_FROM, name: "GjuhëGjerma App" },
    to: [{ email: "ledion.0204@gmail.com", name: "Test User" }],
    subject: "Brevo Test Email",
    htmlContent: "<h1>Hello!</h1><p>Testing Brevo email sending.</p>",
  };

  try {
    const res = await client.sendTransacEmail(emailData);
    console.log("✅ Email sent:", res);
  } catch (err) {
    console.error("❌ Error:", err.body || err);
  }
};

sendEmail();
