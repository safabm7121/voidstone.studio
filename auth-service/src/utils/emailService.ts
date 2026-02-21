import nodemailer from 'nodemailer';

// Configure your email transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address
    pass: process.env.EMAIL_PASS, // Your Gmail app password (see Step 3)
  },
});

// Verify connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Email service configuration error:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

// Send verification email
export const sendVerificationEmail = async (email: string, code: string, firstName: string) => {
  const mailOptions = {
    from: '"Voidstone Studio" <noreply@voidstone.studio>',
    to: email,
    subject: 'Verify Your Voidstone Studio Account',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Inter', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          .header { background: black; padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-weight: 600; letter-spacing: 2px; }
          .content { padding: 40px 30px; text-align: center; }
          .content h2 { color: #333; margin-bottom: 20px; }
          .code { background: #f0f0f0; padding: 20px; border-radius: 8px; font-size: 36px; letter-spacing: 8px; font-weight: 600; margin: 30px 0; color: black; }
          .footer { background: #f9f9f9; padding: 20px; text-align: center; color: #666; font-size: 14px; }
          .button { background: black; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>VOIDSTONE STUDIO</h1>
          </div>
          <div class="content">
            <h2>Welcome, ${firstName}!</h2>
            <p>Thank you for registering. Please use the verification code below to complete your registration:</p>
            <div class="code">${code}</div>
            <p>This code will expire in 1 hour.</p>
            <p>Or click the button below to verify your email:</p>
            <a href="http://localhost:5173/verify-email?email=${encodeURIComponent(email)}&code=${code}" class="button">Verify Email</a>
          </div>
          <div class="footer">
            <p>If you didn't request this, please ignore this email.</p>
            <p>&copy; 2026 Voidstone Studio. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    // Plain text version for email clients that don't support HTML
    text: `
      Welcome to Voidstone Studio, ${firstName}!
      
      Your verification code is: ${code}
      
      This code will expire in 1 hour.
      
      If you didn't request this, please ignore this email.
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};