
// Mock Resend class for testing without real API
class MockResend {
  emails = {
    send: async (options: any) => {
      console.log("📧 Mock email sent:", options);
      return { id: "mock-id-123", status: "sent" };
    },
  };
}

// Use mock resend instead of real one
const resend = new MockResend();

export const sendVerificationEmail = async (email: string, token: string) => {
    const confirmLink = `https://pro-merchants.vercel.app/auth/email-verification?token=${token}`

    await resend.emails.send({
        from: "onboarding@biggamegraphics.in",
        to: email,
        subject: "Confirm your email",
        html: `
        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Verify Your Email - TradingPro</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333333;
                        margin: 0;
                        padding: 0;
                        background-color: #f4f4f4;
                    }
                    .container {
                        max-width: 600px;
                        margin: 20px auto;
                        background-color: #ffffff;
                        padding: 20px;
                        border-radius: 5px;
                        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                    }
                    .logo {
                        text-align: center;
                        margin-bottom: 20px;
                    }
                    .logo img {
                        max-width: 200px;
                        height: auto;
                    }
                    h1 {
                        color: #4CAF50;
                        text-align: center;
                    }
                    .button {
                        display: inline-block;
                        background-color: #4CAF50;
                        color: #ffffff;
                        text-decoration: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        margin-top: 20px;
                    }
                    .footer {
                        margin-top: 20px;
                        text-align: center;
                        font-size: 12px;
                        color: #666666;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="logo">
                        <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-WgXBGSOL7Eq1QZ7NcZItH5rbxyqXmt.png" alt="TradingPro Logo">
                    </div>
                    <h1>Welcome to TradingPro!</h1>
                    <p>Dear Store Owner,</p>
                    <p>Thank you for choosing TradingPro for your e-commerce journey. We're excited to have you on board!</p>
                    <p>To get started, please verify your email address by clicking the button below:</p>
                    <p style="text-align: center;">
                        <a href="${confirmLink}" class="button">Verify Email Address</a>
                    </p>
                    <p>If the button above doesn't work, you can also copy and paste the following link into your browser:</p>
                    <p>${confirmLink}</p>
                    <p>This link will expire in 24 hours for security reasons. If you didn't create an account with TradingPro, please ignore this email.</p>
                    <p>We look forward to helping you grow your online business!</p>
                    <p>Best regards,<br>The TradingPro Team</p>
                    <div class="footer">
                        <p>&copy; 2024 TradingPro. All rights reserved.</p>
                        <p>If you have any questions, please contact our support team at support@TradingPro.com</p>
                    </div>
                </div>
            </body>
        </html>`
    });
};


export const sendPasswordResetEmail = async (email: string, token: string) => {
    try {
        const confirmLink = `https://pro-merchants.vercel.app/auth/password-reset?token=${token}`;

        await resend.emails.send({
            from: "onboarding@biggamegraphics.in",
            to: email,
            subject: "Reset your password",
            html: `
            <h1>Reset Your Password</h1>
            <p>Click the link below to reset your password:</p>
            <a href='${confirmLink}'>Reset Password</a>
            <p>If you didn't request this, please ignore this email.</p>
            <p>This link will expire in 1 hour.</p>
        `
        });
    } catch (error) {
        console.error("Error sending reset email:", error);
        throw new Error("Failed to send reset email");
    }
};
