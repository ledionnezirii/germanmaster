// utils/emailTemplates.js

const getEmailTemplate = (content, buttonText, buttonUrl) => {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="x-apple-disable-message-reformatting">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5; -webkit-text-size-adjust: 100%;">
    
    <div style="width: 100%; background-color: #f5f5f5; padding: 20px 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="padding: 40px 20px; text-align: center; background-color: #F97316;">
                <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">
                    ${content.title}
                </h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 20px;">
                
                <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px;">
                    Përshëndetje <strong>${content.userName}</strong>,
                </p>
                
                <p style="margin: 0 0 30px 0; color: #555555; font-size: 15px; line-height: 1.6;">
                    ${content.message}
                </p>
                
                ${buttonUrl ? `
                
                <!-- Big Clickable Button -->
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${buttonUrl}" target="_blank" rel="noopener" style="
                        display: inline-block;
                        background-color: #F97316;
                        color: #ffffff !important;
                        text-decoration: none !important;
                        padding: 16px 45px;
                        font-size: 18px;
                        font-weight: bold;
                        border-radius: 8px;
                        box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
                        -webkit-text-size-adjust: none;
                        text-align: center;
                    ">${buttonText}</a>
                </div>
                
                <!-- Separator -->
                <div style="height: 1px; background-color: #e0e0e0; margin: 35px 0;"></div>
                
                <!-- Explicit Clickable Link Section -->
                <div style="background-color: #FFF8F3; border: 2px solid #F97316; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <p style="margin: 0 0 12px 0; color: #333333; font-size: 15px; font-weight: bold; text-align: center;">
                        📱 Ose klikoni direkt këtu:
                    </p>
                    <p style="margin: 0; text-align: center; line-height: 1.8;">
                        <a href="${buttonUrl}" target="_blank" rel="noopener" style="
                            color: #F97316 !important;
                            font-size: 15px;
                            font-weight: 600;
                            text-decoration: underline !important;
                            word-break: break-all;
                            -webkit-text-size-adjust: none;
                        ">${buttonUrl}</a>
                    </p>
                </div>
                
                <!-- Manual Instructions -->
                <div style="margin-top: 25px; padding: 15px; background-color: #F9FAFB; border-left: 4px solid #F97316; border-radius: 4px;">
                    <p style="margin: 0; color: #666666; font-size: 13px; line-height: 1.6;">
                        <strong>⚠️ Nuk po funksionon?</strong><br>
                        Shtypni dhe mbani lidhjen e mësipërme, pastaj zgjidhni "Hap" ose "Open" nga menu.
                    </p>
                </div>
                
                ` : ''}
                
            </div>
            
            <!-- Footer -->
            <div style="padding: 25px 20px; background-color: #F9FAFB; text-align: center; border-top: 1px solid #e0e0e0;">
                <p style="margin: 0 0 8px 0; color: #999999; font-size: 13px;">
                    Ky email u dërgua nga <strong>gjuhagjermane</strong>
                </p>
                <p style="margin: 0; color: #cccccc; font-size: 12px;">
                    © ${new Date().getFullYear()} gjuhagjermane
                </p>
            </div>
            
        </div>
    </div>
    
</body>
</html>
  `;
};

// New template for verification codes
const getVerificationCodeTemplate = (content) => {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="x-apple-disable-message-reformatting">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5; -webkit-text-size-adjust: 100%;">
    
    <div style="width: 100%; background-color: #f5f5f5; padding: 20px 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="padding: 40px 20px; text-align: center; background-color: #F97316;">
                <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">
                    ${content.title}
                </h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 20px;">
                
                <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px;">
                    Përshëndetje <strong>${content.userName}</strong>,
                </p>
                
                <p style="margin: 0 0 30px 0; color: #555555; font-size: 15px; line-height: 1.6;">
                    ${content.message}
                </p>
                
                <!-- Verification Code Display -->
                <div style="background-color: #F8FAFC; border: 2px dashed #F97316; border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center;">
                    <p style="margin: 0 0 15px 0; color: #64748B; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">
                        Kodi juaj i verifikimit
                    </p>
                    <div style="
                        font-size: 32px;
                        font-weight: bold;
                        color: #F97316;
                        letter-spacing: 8px;
                        line-height: 1;
                        font-family: 'Courier New', monospace;
                        background-color: #FFFFFF;
                        padding: 20px;
                        border-radius: 8px;
                        border: 1px solid #E2E8F0;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    ">
                        ${content.verificationCode}
                    </div>
                </div>
                
                <!-- Instructions -->
                <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 4px; padding: 20px; margin: 25px 0;">
                    <p style="margin: 0; color: #92400E; font-size: 14px; line-height: 1.6;">
                        <strong>📝 Si të përdorni kodin:</strong><br>
                        1. Shkoni tek faqja e verifikimit<br>
                        2. Shkruani kodin 6-shifror në fushën e duhur<br>
                        3. Klikoni "Verifiko"<br>
                        <br>
                        <strong>⏰ Kodi skadon pas 10 minutash!</strong>
                    </p>
                </div>
                
            </div>
            
            <!-- Footer -->
            <div style="padding: 25px 20px; background-color: #F9FAFB; text-align: center; border-top: 1px solid #e0e0e0;">
                <p style="margin: 0 0 8px 0; color: #999999; font-size: 13px;">
                    Ky email u dërgua nga <strong>gjuhagjermane</strong>
                </p>
                <p style="margin: 0; color: #cccccc; font-size: 12px;">
                    © ${new Date().getFullYear()} gjuhagjermane
                </p>
            </div>
            
        </div>
    </div>
    
</body>
</html>
  `;
};

const getPlainTextVersion = (content, buttonUrl) => {
  let text = `
${content.title}
${'='.repeat(content.title.length)}

Përshëndetje ${content.userName},

${content.message}
`;

  if (buttonUrl) {
    text += `

📱 KLIKONI NË LIDHJEN MË POSHTË:

${buttonUrl}

⚠️ Nëse nuk funksionon:
1. Kopjoni lidhjen e mësipërme
2. Hapni Safari ose Chrome
3. Ngjiteni lidhjen dhe shtypni Enter

`;
  }

  text += `

---
Ky email u dërgua nga gjuhagjermane.
© ${new Date().getFullYear()} gjuhagjermane
  `;

  return text.trim();
};

// Plain text version for verification codes
const getVerificationCodeTextVersion = (content) => {
  return `
${content.title}
${'='.repeat(content.title.length)}

Përshëndetje ${content.userName},

${content.message}

KODI I VERIFIKIMIT: ${content.verificationCode}

📝 Si të përdorni kodin:
1. Shkoni tek faqja e verifikimit
2. Shkruani kodin 6-shifror në fushën e duhur
3. Klikoni "Verifiko"

⏰ Kodi skadon pas 10 minutash!

---
Ky email u dërgua nga gjuhagjermane.
© ${new Date().getFullYear()} gjuhagjermane
  `.trim();
};

module.exports = { 
  getEmailTemplate, 
  getPlainTextVersion,
  getVerificationCodeTemplate,
  getVerificationCodeTextVersion
};