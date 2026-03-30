const nodemailer = require('nodemailer');

async function sendEmail(userEmail, message) {
    console.log("Sending email to:", userEmail);

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.AUTH_EMAIL,
            pass: process.env.AUTH_PASSWORD,
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log("Verifying SMTP...");
        await transporter.verify();
        console.log("SMTP verified ✅");
    } catch (err) {
        console.log("SMTP VERIFY ERROR ❌:", err);
        throw err;
    }

    const mailOptions = {
        from: process.env.AUTH_EMAIL,
        to: userEmail,
        subject: "ProjexHub Verification Code",
        html: `<h1>Code: ${message}</h1>`
    };

    try {
        console.log("Sending mail...");
        await transporter.sendMail(mailOptions);
        console.log("Email sent successfully ✅");
    } catch (error) {
        console.log("SEND MAIL ERROR ❌:", error);
        throw error;
    }
}

module.exports = sendEmail;