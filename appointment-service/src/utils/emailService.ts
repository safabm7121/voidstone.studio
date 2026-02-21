import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendAppointmentEmails = async (
  appointment: any,
  designer: any,
  customer: any
) => {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Email to customer
  await transporter.sendMail({
    from: '"Voidstone Studio" <voidstonestudio@gmail.com>',
    to: customer.email,
    subject: `Appointment Confirmation - ${formatDate(appointment.date)}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; }
          .header { background: black; color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .details { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .button { background: black; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>VOIDSTONE STUDIO</h1>
          </div>
          <div class="content">
            <h2>Appointment Confirmed!</h2>
            <p>Dear ${customer.name},</p>
            <p>Your appointment with <strong>${designer.name}</strong> has been confirmed.</p>
            
            <div class="details">
              <h3>📅 Appointment Details</h3>
              <p><strong>Date:</strong> ${formatDate(appointment.date)}</p>
              <p><strong>Time:</strong> ${appointment.timeSlot}</p>
              <p><strong>Designer:</strong> ${designer.name}</p>
              ${appointment.notes ? `<p><strong>Notes:</strong> ${appointment.notes}</p>` : ''}
            </div>
            
            <p>Need to reschedule? <a href="http://localhost:5173/appointments/${appointment._id}">Manage appointment</a></p>
          </div>
        </div>
      </body>
      </html>
    `
  });

  // Email to designer
  await transporter.sendMail({
    from: '"Voidstone Studio" <voidstonestudio@gmail.com>',
    to: designer.email,
    subject: `New Appointment - ${customer.name}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; }
          .header { background: black; color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .highlight { background: #fff3cd; padding: 5px 10px; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 New Appointment</h1>
          </div>
          <div class="content">
            <h2>You have a new appointment!</h2>
            <p><strong>Client:</strong> ${customer.name}</p>
            <p><strong>Email:</strong> ${customer.email}</p>
            <p><strong>Date:</strong> ${formatDate(appointment.date)}</p>
            <p><strong>Time:</strong> <span class="highlight">${appointment.timeSlot}</span></p>
            ${appointment.notes ? `<p><strong>Notes:</strong> ${appointment.notes}</p>` : ''}
          </div>
        </div>
      </body>
      </html>
    `
  });
};