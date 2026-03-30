const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendEmail(userEmail, message) {
    try {
        console.log("Sending email via SendGrid to:", userEmail);

        const msg = {
            to: userEmail,
            from: process.env.VERIFIED_GMAIL,
            subject: 'ProjexHub Verification Code',
            html: `
                <h1>ProjexHub Verification Code</h1>
                <h2 style="color:blue;">${message}</h2>
            `
        };

        const response = await sgMail.send(msg);

        console.log("Email sent ✅", response[0].statusCode);
        return { success: true, response };

    } catch (error) {
        console.error("SendGrid Error ❌:", error.response?.body || error.message);
        return { success: false, error };
    }
}

module.exports = sendEmail;