import { Resend } from 'resend';

// Initialize Resend with API key from environment
const resend = new Resend(process.env.RESEND_API_KEY || '');

console.log('✅ Resend email service initialized');

// Send verification email
export const sendVerificationEmail = async (email: string, code: string, firstName: string) => {
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not configured in .env');
    throw new Error('Email configuration missing');
  }

  try {
    console.log(`📧 Attempting to send verification email to ${email}...`);
    
    const { data, error } = await resend.emails.send({
      from: 'Voidstone Studio <onboarding@resend.dev>',
      to: [email],
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
              <a href="https://voidstone-frontend.onrender.com/verify-email?email=${encodeURIComponent(email)}&code=${code}" class="button">Verify Email</a>
            </div>
            <div class="footer">
              <p>If you didn't request this, please ignore this email.</p>
              <p>&copy; ${new Date().getFullYear()} Voidstone Studio. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to Voidstone Studio, ${firstName}!
        
        Your verification code is: ${code}
        
        This code will expire in 1 hour.
        
        If you didn't request this, please ignore this email.
      `,
    });

    if (error) {
      console.error('❌ Resend error:', error);
      throw error;
    }

    console.log(`✅ Verification email sent to ${email}: ${data?.id}`);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    throw error;
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (email: string, code: string, firstName: string) => {
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not configured in .env');
    throw new Error('Email configuration missing');
  }

  try {
    console.log(`📧 Attempting to send password reset email to ${email}...`);
    
    const { data, error } = await resend.emails.send({
      from: 'Voidstone Studio <onboarding@resend.dev>',
      to: [email],
      subject: 'Reset Your Voidstone Studio Password',
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
            .warning { color: #dc3545; font-size: 14px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>VOIDSTONE STUDIO</h1>
            </div>
            <div class="content">
              <h2>Password Reset Request</h2>
              <p>Hello ${firstName},</p>
              <p>We received a request to reset your password. Please use the verification code below:</p>
              <div class="code">${code}</div>
              <p>This code will expire in 1 hour.</p>
              <p>Or click the button below to reset your password:</p>
              <a href="https://voidstone-frontend.onrender.com/reset-password?email=${encodeURIComponent(email)}&code=${code}" class="button">Reset Password</a>
              <p class="warning">If you didn't request this, please ignore this email and ensure your account is secure.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Voidstone Studio. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Hello ${firstName},
        
        We received a request to reset your password. Your verification code is: ${code}
        
        This code will expire in 1 hour.
        
        If you didn't request this, please ignore this email and ensure your account is secure.
      `,
    });

    if (error) {
      console.error('❌ Resend error:', error);
      throw error;
    }

    console.log(`✅ Password reset email sent to ${email}: ${data?.id}`);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    throw error;
  }
};

// Optional test function
export const testEmailConnection = async () => {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not set');
    }
    console.log('✅ Resend configured');
    return true;
  } catch (error) {
    console.error('❌ Resend configuration failed:', error);
    return false;
  }
};