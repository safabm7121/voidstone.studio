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
      subject: `🛍️ New Order Received - ${orderId}`,
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
      <td><img src="${item.images[0]}" width="50"/></td>
      <td>${item.name}</td>
      <td>${item.quantity}</td>
      <td>$${item.price}</td>
      <td>$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <h1>Thank you for your order!</h1>
    <p>Order ID: ${orderId}</p>
    <h2>Items:</h2>
    <table border="1" cellpadding="10">
      <tr><th>Product</th><th>Name</th><th>Qty</th><th>Price</th><th>Total</th></tr>
      ${itemsList}
    </table>
    <h3>Total: $${cartTotal.toFixed(2)}</h3>
    <h3>Shipping to:</h3>
    <p>${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.zipCode}, ${shippingInfo.country}</p>
  `;
};

const getStoreEmailTemplate = (data: any) => {
  const { items, shippingInfo, cartTotal, orderId } = data;
  
  const itemsList = items.map((item: any) => `
    <tr>
      <td>${item.name}</td>
      <td>${item.quantity}</td>
      <td>$${item.price}</td>
      <td>$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <h1>🛍️ NEW ORDER!</h1>
    <p>Order ID: ${orderId}</p>
    <h2>Items:</h2>
    <table border="1" cellpadding="10">
      <tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr>
      ${itemsList}
    </table>
    <h3>Total: $${cartTotal.toFixed(2)}</h3>
    <h3>Customer:</h3>
    <p>${shippingInfo.firstName} ${shippingInfo.lastName}</p>
    <p>Email: ${shippingInfo.email}</p>
    <p>Address: ${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.zipCode}, ${shippingInfo.country}</p>
    <p>Payment: ${shippingInfo.paymentMethod}</p>
  `;
};