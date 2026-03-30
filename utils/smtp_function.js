const nodemailer = require('nodemailer');

async function sendEmail(userEmail, message) {
    console.log("Sending email to:", userEmail);

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.AUTH_EMAIL,
            pass: process.env.AUTH_PASSWORD,
        }
    });

    try {
        await transporter.verify();
        console.log("SMTP server is ready");
    } catch (err) {
        console.log("SMTP ERROR:", err);
    }

    const mailOptions = {
        from: process.env.AUTH_EMAIL,
        to: userEmail,
        subject: "ProjexHub Verification Code",
        html: `<h1>ProjexHub Verification Code</h1>
                <h2>${message}</h2>`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log("Email sent successfully");
    } catch (error) {
        console.log("Email sending failed:", error);
    }
}

module.exports = sendEmail;