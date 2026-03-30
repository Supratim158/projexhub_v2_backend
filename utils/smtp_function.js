const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail(userEmail, message) {
    try {
        console.log("Sending email via Resend to:", userEmail);

        const { data, error } = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: userEmail,
            subject: 'ProjexHub Verification Code',
            html: `
                <h1>ProjexHub Verification Code</h1>
                <h2 style="color:blue;">${message}</h2>
            `
        });

        if (error) {
            console.error("Resend API Error ❌:", error);
            return { success: false, error };
        }

        console.log("Email sent ✅", data);
        return { success: true, data };
    } catch (catchError) {
        console.error("Resend Execution Error ❌:", catchError);
        return { success: false, error: catchError };
    }
}

module.exports = sendEmail;