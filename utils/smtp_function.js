const nodemailer = require('nodemailer');

async function sendEmail(userEmail, message) {
    try {
        console.log("Sending email via Brevo to:", userEmail);

        const transporter = nodemailer.createTransport({
            host: 'smtp-relay.brevo.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.BREVO_USER,      // usually your email
                pass: process.env.BREVO_API_KEY   // Brevo SMTP key
            }
        });

        const mailOptions = {
            from: `"ProjexHub" <${process.env.VERIFIED_GMAIL}>`, // must be verified in Brevo
            to: userEmail,
            subject: 'ProjexHub Verification Code',
            html: `
                <h1>ProjexHub Verification Code</h1>
                <h2 style="color:blue;">${message}</h2>
            `
        };

        const info = await transporter.sendMail(mailOptions);

        console.log("Email sent ✅", info.messageId);
        return { success: true, info };

    } catch (error) {
        console.error("Brevo Error ❌:", error.message);
        return { success: false, error };
    }
}

module.exports = sendEmail;