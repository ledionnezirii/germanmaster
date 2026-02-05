// utils/emailTemplates.js

const getEmailTemplate = (content, buttonText, buttonUrl) => {
  return `
<!DOCTYPE html>
<html lang="sq">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <!--[if mso]>
    <style type="text/css">
        table {border-collapse: collapse !important;}
    </style>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f4;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f4f4;" cellpadding="0" cellspacing="0">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <!-- Main Container -->
                <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden;" cellpadding="0" cellspacing="0">
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 30px; text-align: center; background-color: #F97316;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                                ${content.title}
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                                Përshëndetje <strong>${content.userName}</strong>,
                            </p>
                            <p style="margin: 0 0 30px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                                ${content.message}
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Button Section -->
                    ${buttonUrl ? `
                    <tr>
                        <td style="padding: 0 30px 40px 30px; text-align: center;">
                            <!-- Button as table for better compatibility -->
                            <table role="presentation" style="margin: 0 auto; border-collapse: collapse;" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="border-radius: 6px; background-color: #F97316;">
                                        <a href="${buttonUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 16px 40px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 6px;">
                                            ${buttonText}
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Fallback text link -->
                            <p style="margin: 25px 0 0 0; color: #999999; font-size: 14px; line-height: 1.5;">
                                Nëse butoni nuk funksionon, kopjoni dhe ngjisni këtë lidhje në shfletues:<br>
                                <a href="${buttonUrl}" target="_blank" rel="noopener noreferrer" style="color: #F97316; word-break: break-all;">
                                    ${buttonUrl}
                                </a>
                            </p>
                        </td>
                    </tr>
                    ` : ''}
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px; background-color: #f9f9f9; border-top: 1px solid #eeeeee; text-align: center;">
                            <p style="margin: 0 0 10px 0; color: #999999; font-size: 13px; line-height: 1.5;">
                                Ky email u dërgua nga <strong>gjuhagjermane</strong>
                            </p>
                            <p style="margin: 0 0 15px 0; color: #999999; font-size: 13px; line-height: 1.5;">
                                Nëse nuk e keni kërkuar këtë email, ju lutemi injoroni.
                            </p>
                            <p style="margin: 0; color: #cccccc; font-size: 12px;">
                                © ${new Date().getFullYear()} gjuhagjermane. Të gjitha të drejtat e rezervuara.
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
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

Klikoni këtu për të vazhduar:
${buttonUrl}

Nëse lidhja nuk funksionon, kopjoni dhe ngjisni URL-në e mësipërme në shfletuesin tuaj.
`;
  }

  text += `

---
Ky email u dërgua nga gjuhagjermane.
Nëse nuk e keni kërkuar këtë email, ju lutemi injoroni.

© ${new Date().getFullYear()} gjuhagjermane. Të gjitha të drejtat e rezervuara.
  `;

  return text.trim();
};

module.exports = { getEmailTemplate, getPlainTextVersion };