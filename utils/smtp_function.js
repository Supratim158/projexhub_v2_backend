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
                htmlContent: `<h1>Your OTP</h1><h2>${message}</h2>`
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