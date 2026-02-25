import axios from 'axios';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001/api';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'voidstonestudio@gmail.com';

export const sendAppointmentEmail = async (
  to: string, 
  subject: string, 
  html: string
): Promise<void> => {
  try {
    console.log(`📧 Sending email to: ${to}`);
    console.log(`📧 Subject: ${subject}`);
    
    const response = await axios.post(`${AUTH_SERVICE_URL}/appointment-email`, {
      to,
      subject,
      html
    });
    
    console.log(`✅ Email sent successfully to ${to}`);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    throw error;
  }
};

export const sendAppointmentNotificationToAdmin = async (
  appointmentDetails: any,
  customerName: string,
  customerEmail: string
) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
        .header { background: black; color: white; padding: 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px; }
        .details { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .details p { margin: 10px 0; }
        .label { font-weight: 600; color: #666; }
        .value { color: #000; }
        .footer { background: #f5f5f5; padding: 20px; text-align: center; color: #666; }
        .badge { background: #ffd700; color: black; padding: 5px 10px; border-radius: 20px; display: inline-block; }
        .button { background: black; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📅 NEW APPOINTMENT BOOKED</h1>
        </div>
        <div class="content">
          <p>A new appointment has been booked by <strong>${customerName}</strong>.</p>
          
          <div class="details">
            <h3>Appointment Details:</h3>
            <p><span class="label">Date:</span> <span class="value">${new Date(appointmentDetails.date).toLocaleDateString()}</span></p>
            <p><span class="label">Time:</span> <span class="value">${appointmentDetails.timeSlot}</span></p>
            <p><span class="label">Type:</span> <span class="badge">${appointmentDetails.consultationType}</span></p>
            ${appointmentDetails.notes ? `<p><span class="label">Notes:</span> ${appointmentDetails.notes}</p>` : ''}
          </div>
          
          <div class="details">
            <h3>Customer Information:</h3>
            <p><span class="label">Name:</span> ${customerName}</p>
            <p><span class="label">Email:</span> ${customerEmail}</p>
            ${appointmentDetails.customerPhone ? `<p><span class="label">Phone:</span> ${appointmentDetails.customerPhone}</p>` : ''}
          </div>
          
          <p style="text-align: center;">
            <a href="http://localhost:5173/admin/appointments" class="button">View in Dashboard</a>
          </p>
        </div>
        <div class="footer">
          <p>Voidstone Studio - Appointment System</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendAppointmentEmail(
    ADMIN_EMAIL,
    `📅 New Appointment: ${customerName} - ${appointmentDetails.consultationType}`,
    html
  );
};

export const sendAppointmentConfirmationToCustomer = async (
  email: string,
  name: string,
  appointmentDetails: any
) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
        .header { background: black; color: white; padding: 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px; }
        .details { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .details p { margin: 10px 0; }
        .label { font-weight: 600; color: #666; }
        .footer { background: #f5f5f5; padding: 20px; text-align: center; color: #666; }
        .badge { background: #ffd700; color: black; padding: 5px 10px; border-radius: 20px; display: inline-block; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Appointment Request Received</h1>
        </div>
        <div class="content">
          <p>Dear <strong>${name}</strong>,</p>
          <p>Thank you for booking an appointment with Voidstone Studio. Your appointment request has been received and is pending confirmation.</p>
          
          <div class="details">
            <h3>Appointment Details:</h3>
            <p><span class="label">Date:</span> ${new Date(appointmentDetails.date).toLocaleDateString()}</p>
            <p><span class="label">Time:</span> ${appointmentDetails.timeSlot}</p>
            <p><span class="label">Type:</span> <span class="badge">${appointmentDetails.consultationType}</span></p>
            ${appointmentDetails.notes ? `<p><span class="label">Your Notes:</span> ${appointmentDetails.notes}</p>` : ''}
          </div>
          
          <p>You will receive a confirmation email once your appointment is confirmed by our team.</p>
          <p>If you need to make any changes, please contact us.</p>
          
          <p style="margin-top: 30px;">Best regards,<br>The Voidstone Studio Team</p>
        </div>
        <div class="footer">
          <p>Voidstone Studio - Where Fashion Meets Art</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendAppointmentEmail(
    email,
    `Appointment Request Received - Voidstone Studio`,
    html
  );
};

export const sendAppointmentConfirmedToCustomer = async (
  email: string,
  name: string,
  appointmentDetails: any
) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px; }
        .details { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .details p { margin: 10px 0; }
        .label { font-weight: 600; color: #666; }
        .footer { background: #f5f5f5; padding: 20px; text-align: center; color: #666; }
        .badge { background: #4CAF50; color: white; padding: 5px 10px; border-radius: 20px; display: inline-block; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Appointment Confirmed!</h1>
        </div>
        <div class="content">
          <p>Dear <strong>${name}</strong>,</p>
          <p>Great news! Your appointment has been <strong>confirmed</strong>.</p>
          
          <div class="details">
            <h3>Appointment Details:</h3>
            <p><span class="label">Date:</span> ${new Date(appointmentDetails.date).toLocaleDateString()}</p>
            <p><span class="label">Time:</span> ${appointmentDetails.timeSlot}</p>
            <p><span class="label">Type:</span> <span class="badge">${appointmentDetails.consultationType}</span></p>
          </div>
          
          <p>We look forward to meeting with you!</p>
          
          <p style="margin-top: 30px;">Best regards,<br>The Voidstone Studio Team</p>
        </div>
        <div class="footer">
          <p>Voidstone Studio - Where Fashion Meets Art</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendAppointmentEmail(
    email,
    `Appointment Confirmed - Voidstone Studio`,
    html
  );
};