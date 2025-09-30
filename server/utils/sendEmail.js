const sgMail = require("@sendgrid/mail");

// Set API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (options) => {
  try {
    const msg = {
      to: options.email,
      from: { 
        email: process.env.EMAIL_FROM, // verified sender
        name: "GjuhëGjerma App"
      },
      subject: options.subject,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
          <h2 style="color: #4f46e5;">Mirë se vini në GjuhëGjerma App!</h2>
          <p>Faleminderit që regjistrohesh. Për të verifikuar email-in tuaj, klikoni butonin më poshtë:</p>
          
          <p style="text-align: center; margin: 30px 0;">
            <a href="${options.url}" 
               style="background-color: #4f46e5; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
               Verifiko Email-in
            </a>
          </p>

          <p>Nëse butoni nuk funksionon, kopjo dhe ngjit këtë link në shfletuesin tuaj:</p>
          <p><a href="${options.url}" style="color: #4f46e5;">${options.url}</a></p>

          <hr style="margin: 30px 0; border: 0; border-top: 1px solid #ccc;" />

          <p style="font-size: 12px; color: #777;">Nëse nuk regjistrohesh ti, vetëm injoro këtë email.</p>
        </div>
      `,
    };

    await sgMail.send(msg);
    console.log("✅ Email sent to:", options.email);
  } catch (error) {
    console.error("❌ Error sending email:", error.response?.body || error);
    throw new Error("Gabim gjatë dërgimit të email-it");
  }
};

module.exports = sendEmail;
