const nodemailer = require('nodemailer');

async function sendEmail(userEmail, message) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.AUTH_EMAIL,
            pass: process.env.AUTH_PASSWORD,
        }
    });

    const mailOptions = {
        from: process.env.AUTH_EMAIL,
        to: userEmail,
        subject: "ProjexHub Verification Code",
        html:  `<h1>ProjexHub Verification Code</h1>
                <p>Your Verification code is:</p>
                <h2 style= "color: blue;">${message}</h2>
                <p>Please enter this code on verification page to complete your registration process.</p>
                <p>If not you, please ignore.</p>`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log("Verification code sent ");
        
    } catch (error) {
        console.log("Email sending failed with an error", error);
        
    }
}

module.exports = sendEmail;