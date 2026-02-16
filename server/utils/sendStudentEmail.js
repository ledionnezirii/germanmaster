const SibApiV3Sdk = require('@sendinblue/client');
require('dotenv').config();

// Initialize client - exact same pattern as sendEmail.js
const client = new SibApiV3Sdk.TransactionalEmailsApi();
client.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

const sendStudentEmail = async ({
  to,
  teacherName,
  groupName,
  academyName,
  teacherCode,
  inviteLink,
}) => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
      <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #4F46E5;">
        <h1 style="color: #4F46E5; margin: 0; font-size: 24px;">${academyName}</h1>
      </div>
      
      <div style="padding: 30px 0;">
        <h2 style="color: #1F2937; margin: 0 0 16px 0;">You've Been Invited!</h2>
        <p style="color: #4B5563; font-size: 16px; line-height: 1.6;">
          Hi there,
        </p>
        <p style="color: #4B5563; font-size: 16px; line-height: 1.6;">
          <strong>${teacherName}</strong> has invited you to join the group 
          <strong>"${groupName}"</strong> in <strong>${academyName}</strong>.
        </p>
        
        <div style="background: #F3F4F6; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
          <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 14px;">Your Teacher Code</p>
          <p style="margin: 0; font-size: 36px; font-weight: bold; color: #4F46E5; letter-spacing: 6px;">${teacherCode}</p>
        </div>
        
        <p style="color: #4B5563; font-size: 16px; line-height: 1.6;">
          You can join using either method:
        </p>
        <ol style="color: #4B5563; font-size: 16px; line-height: 1.8;">
          <li>Enter the <strong>Teacher Code</strong> above in the Academy page</li>
          <li>Or click the button below:</li>
        </ol>
        
        <div style="text-align: center; margin: 28px 0;">
          <a href="${inviteLink}" 
             style="display: inline-block; background: #4F46E5; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
            Join Group
          </a>
        </div>
      </div>
      
      <div style="border-top: 1px solid #E5E7EB; padding-top: 16px;">
        <p style="color: #9CA3AF; font-size: 12px; text-align: center;">
          If you didn't expect this email, you can safely ignore it.
        </p>
      </div>
    </div>
  `;

  // Use the exact same emailData structure as your working sendEmail.js
  const emailData = {
    sender: { email: process.env.EMAIL_FROM, name: "gjuhagjermane" },
    to: [{ email: to, name: "Student" }],
    subject: `You're invited to join "${groupName}" - ${academyName}`,
    htmlContent,
  };

  try {
    const res = await client.sendTransacEmail(emailData);
    console.log("Student email sent:", res.body.messageId);
    return true;
  } catch (err) {
    console.error("Error sending student email:", JSON.stringify(err.response?.body || err.body || err.message || err, null, 2));
    return false;
  }
};

module.exports = sendStudentEmail;
