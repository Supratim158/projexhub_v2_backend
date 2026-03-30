const axios = require('axios');

async function sendEmail(userEmail, message) {
    try {
        console.log("Sending email via Brevo API...");

        const response = await axios.post(
            'https://api.brevo.com/v3/smtp/email',
            {
                sender: {
                    name: "ProjexHub",
                    email: process.env.VERIFIED_GMAIL
                },
                to: [
                    {
                        email: userEmail
                    }
                ],
                subject: "ProjexHub Verification Code",
                htmlContent: `
  <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
    
    <h2 style="margin-bottom: 10px;">ProjexHub Verification</h2>
    
    <p style="font-size: 14px;">
      Your One-Time Password (OTP) is:
    </p>

    <div style="
      font-size: 28px;
      font-weight: bold;
      color: #2563eb;
      margin: 15px 0;
    ">
      ${message}
    </div>

    <p style="font-size: 13px; color: #555;">
      This code is valid for 5 minutes. Please do not share it with anyone.
    </p>

    <hr style="margin: 20px 0;" />

    <p style="font-size: 12px; color: #888;">
      If you didn’t request this, you can safely ignore this email.
    </p>

  </div>
`
            },
            {
                headers: {
                    'api-key': process.env.BREVO_API_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log("Email sent ✅", response.data);
        return { success: true };

    } catch (error) {
        console.error("Brevo API Error ❌:", error.response?.data || error.message);
        return { success: false };
    }
}

module.exports = sendEmail;