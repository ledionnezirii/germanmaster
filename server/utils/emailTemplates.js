// utils/emailTemplates.js

const getEmailTemplate = (content, buttonText, buttonUrl) => {
  return `
<!DOCTYPE html>
<html lang="sq">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4; padding: 20px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 30px; text-align: center; background-color: #F97316; border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">
                                ${content.title}
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Body -->
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
                    
                    <!-- Button - SIMPLIFIED for iPhone -->
                    ${buttonUrl ? `
                    <tr>
                        <td style="padding: 0 30px 20px 30px; text-align: center;">
                            <a href="${buttonUrl}" style="display: inline-block; background-color: #F97316; color: #ffffff; text-decoration: none; padding: 15px 40px; font-size: 16px; font-weight: bold; border-radius: 6px; text-align: center;">
                                ${buttonText}
                            </a>
                        </td>
                    </tr>
                    
                    <!-- Divider -->
                    <tr>
                        <td style="padding: 20px 30px;">
                            <div style="border-top: 1px solid #eeeeee;"></div>
                        </td>
                    </tr>
                    
                    <!-- Text Link - ALWAYS VISIBLE -->
                    <tr>
                        <td style="padding: 0 30px 40px 30px;">
                            <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px; text-align: center;">
                                Ose kopjoni dhe ngjisni këtë lidhje:
                            </p>
                            <p style="margin: 0; text-align: center;">
                                <a href="${buttonUrl}" style="color: #F97316; font-size: 14px; word-break: break-all; text-decoration: underline;">
                                    ${buttonUrl}
                                </a>
                            </p>
                        </td>
                    </tr>
                    ` : ''}
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px; background-color: #f9f9f9; border-top: 1px solid #eeeeee; text-align: center; border-radius: 0 0 8px 8px;">
                            <p style="margin: 0 0 10px 0; color: #999999; font-size: 13px;">
                                Ky email u dërgua nga <strong>gjuhagjermane</strong>
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

Klikoni në këtë lidhje për të vazhduar:
${buttonUrl}

`;
  }

  text += `

---
Ky email u dërgua nga gjuhagjermane.

© ${new Date().getFullYear()} gjuhagjermane. Të gjitha të drejtat e rezervuara.
  `;

  return text.trim();
};

module.exports = { getEmailTemplate, getPlainTextVersion };