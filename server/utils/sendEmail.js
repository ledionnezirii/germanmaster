const SibApiV3Sdk = require('@sendinblue/client');
require('dotenv').config();

// Initialize client
const client = new SibApiV3Sdk.TransactionalEmailsApi();

// Set API key
client.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

const sendEmail = async ({ to, subject, htmlContent, textContent }) => {
  const emailData = {
    sender: { email: process.env.EMAIL_FROM, name: "gjuhagjermane" },
    to: [{ email: to, name: "User" }],
    subject,
    htmlContent,
    textContent: textContent || htmlContent.replace(/<[^>]*>/g, ''), // Add plain text fallback
    // Add these for better deliverability
    headers: {
      'X-Mailin-custom': 'custom_header_1:custom_value_1|custom_header_2:custom_value_2',
      'charset': 'iso-8859-1'
    }
  };

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