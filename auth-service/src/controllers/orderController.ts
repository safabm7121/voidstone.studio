import { Request, Response } from 'express';
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

export const sendOrderEmails = async (req: Request, res: Response) => {
  try {
    const { items, shippingInfo, cartTotal, orderId } = req.body;

    // Email to buyer
    await transporter.sendMail({
      from: '"Voidstone Studio" <voidstonestudio@gmail.com>',
      to: shippingInfo.email,
      subject: `Order Confirmation - ${orderId}`,
      html: getBuyerEmailTemplate({ items, shippingInfo, cartTotal, orderId })
    });

    // Email to store
    await transporter.sendMail({
      from: '"Voidstone Studio" <voidstonestudio@gmail.com>',
      to: 'voidstonestone@gmail.com',
      subject: `New Order Received - ${orderId}`,
      html: getStoreEmailTemplate({ items, shippingInfo, cartTotal, orderId })
    });

    res.json({ success: true, message: 'Order emails sent successfully' });
  } catch (error) {
    console.error('Error sending order emails:', error);
    res.status(500).json({ error: 'Failed to send order emails' });
  }
};

const getBuyerEmailTemplate = (data: any) => {
  const { items, shippingInfo, cartTotal, orderId } = data;
  
  const itemsList = items.map((item: any) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(2)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #000; color: #fff; padding: 20px; text-align: center; }
        .header h1 { margin: 0; }
        .content { padding: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #f5f5f5; padding: 10px; text-align: left; }
        td { padding: 10px; }
        .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }
        .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>VOIDSTONE STUDIO</h1>
        </div>
        <div class="content">
          <h2>Thank you for your order, ${shippingInfo.firstName}!</h2>
          <p><strong>Order ID:</strong> ${orderId}</p>
          
          <h3>Order Summary</h3>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsList}
            </tbody>
          </table>
          
          <div class="total">
            Total: $${cartTotal.toFixed(2)}
          </div>
          
          <h3>Shipping Information</h3>
          <p>${shippingInfo.firstName} ${shippingInfo.lastName}</p>
          <p>${shippingInfo.address}</p>
          <p>${shippingInfo.city}, ${shippingInfo.zipCode}</p>
          <p>${shippingInfo.country}</p>
          
          <h3>Payment Method</h3>
          <p>${shippingInfo.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : shippingInfo.paymentMethod}</p>
        </div>
        <div class="footer">
          <p>If you have any questions, contact us at voidstonestudio@gmail.com</p>
          <p>&copy; ${new Date().getFullYear()} Voidstone Studio. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const getStoreEmailTemplate = (data: any) => {
  const { items, shippingInfo, cartTotal, orderId } = data;
  
  const itemsList = items.map((item: any) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(2)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #000; color: #fff; padding: 20px; text-align: center; }
        .header h1 { margin: 0; }
        .content { padding: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #f5f5f5; padding: 10px; text-align: left; }
        td { padding: 10px; }
        .highlight { background: #fff3cd; padding: 5px; border-radius: 4px; }
        .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🛍️ NEW ORDER RECEIVED</h1>
        </div>
        <div class="content">
          <h2>Order Details</h2>
          <p><strong>Order ID:</strong> <span class="highlight">${orderId}</span></p>
          
          <h3>Customer Information</h3>
          <p><strong>Name:</strong> ${shippingInfo.firstName} ${shippingInfo.lastName}</p>
          <p><strong>Email:</strong> ${shippingInfo.email}</p>
          <p><strong>Phone:</strong> ${shippingInfo.phone || 'Not provided'}</p>
          
          <h3>Shipping Address</h3>
          <p>${shippingInfo.address}</p>
          <p>${shippingInfo.city}, ${shippingInfo.zipCode}</p>
          <p>${shippingInfo.country}</p>
          
          <h3>Payment Method</h3>
          <p>${shippingInfo.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : shippingInfo.paymentMethod}</p>
          
          <h3>Order Items</h3>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsList}
            </tbody>
          </table>
          
          <div class="total">
            Total Amount: $${cartTotal.toFixed(2)}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};