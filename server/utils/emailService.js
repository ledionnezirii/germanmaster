const nodemailer = require("nodemailer")

// Simple test email service - NO SETUP REQUIRED!
const createTestTransporter = async () => {
  try {
    // Creates a fake email account for testing
    const testAccount = await nodemailer.createTestAccount()

    console.log("📧 Using test email service (no Gmail setup needed!)")
    console.log("📧 Test account created:", testAccount.user)

    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    })
  } catch (error) {
    console.error("Failed to create test transporter:", error)
    throw error
  }
}

const sendVerificationEmail = async (email, token) => {
  try {
    console.log(`📧 Sending verification email to: ${email}`)

    const transporter = await createTestTransporter()
    await transporter.verify()
    console.log("✅ Test email service connected!")

    const verificationUrl = `${process.env.FRONTEND_URL || process.env.CLIENT_URL}/verify-email/${token}`

    const mailOptions = {
      from: '"🇩🇪 German Master" <noreply@germanmaster.com>',
      to: email,
      subject: "Verify Your Email Address - German Master",
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0d9488; margin: 0; font-size: 28px;">🇩🇪 German Master</h1>
            <p style="color: #6b7280; margin: 5px 0 0 0;">Learn German Like a Pro</p>
          </div>
          
          <div style="background-color: #f0fdfa; padding: 25px; border-radius: 8px; border-left: 4px solid #0d9488; margin-bottom: 30px;">
            <h2 style="color: #1f2937; margin: 0 0 15px 0;">Willkommen! Welcome!</h2>
            <p style="color: #4b5563; line-height: 1.6; margin: 0;">
              Thank you for joining German Master! Click the button below to verify your email address and start learning German.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #0d9488; color: white; padding: 15px 35px; 
                      text-decoration: none; border-radius: 8px; font-weight: bold;
                      display: inline-block; font-size: 16px;">
              ✅ Verify Email Address
            </a>
          </div>
          
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
              <strong>Can't click the button?</strong> Copy and paste this link:
              <br>
              <a href="${verificationUrl}" style="color: #0d9488; word-break: break-all;">
                ${verificationUrl}
              </a>
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
            <p>© 2024 German Master. Start your German learning adventure! 🚀</p>
          </div>
        </div>
      `,
      text: `
        German Master - Verify Your Email
        
        Willkommen! Welcome to German Master!
        
        Please verify your email by visiting: ${verificationUrl}
        
        This link expires in 24 hours.
        
        © 2024 German Master
      `,
    }

    const result = await transporter.sendMail(mailOptions)

    // Show the preview URL in console
    const previewUrl = nodemailer.getTestMessageUrl(result)
    console.log("✅ Test email sent successfully!")
    console.log("📧 Email Preview URL:", previewUrl)
    console.log("👆 Click this URL to see the email and get the verification link!")

    return result
  } catch (error) {
    console.error("❌ Failed to send verification email:", error)
    throw error
  }
}

const testEmailConnection = async () => {
  try {
    console.log("📧 Testing email connection...")
    await createTestTransporter()
    console.log("✅ Test email service is ready!")
    return true
  } catch (error) {
    console.error("❌ Email service failed:", error.message)
    return false
  }
}

module.exports = {
  sendVerificationEmail,
  testEmailConnection,
}
