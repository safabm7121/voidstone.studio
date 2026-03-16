import { FRONTEND_URL } from '../config/urls';

export const getBuyerEmailTemplate = (orderData: any) => {
  const { shippingInfo, items, cartTotal, orderId } = orderData;
  
  const itemsList = items.map((item: any) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        <img src="${item.images?.[0] || 'https://via.placeholder.com/50'}" width="50" height="50" style="border-radius: 4px;">
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">x${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">$${item.price}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Inter', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .header { background: black; padding: 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-weight: 600; letter-spacing: 2px; }
        .content { padding: 40px 30px; }
        .order-info { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .order-info p { margin: 5px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #f0f0f0; padding: 12px; text-align: left; }
        td { padding: 12px; border-bottom: 1px solid #eee; }
        .total { font-size: 18px; font-weight: 600; text-align: right; margin-top: 20px; }
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
          <h2>Thank you for your order, ${shippingInfo.firstName}!</h2>
          <p>Your order has been confirmed and will be processed shortly.</p>
          
          <div class="order-info">
            <h3>📋 Order Details</h3>
            <p><strong>Order ID:</strong> ${orderId}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>

          <h3>📦 Order Items</h3>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Name</th>
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
            <p>Total: $${cartTotal.toFixed(2)}</p>
          </div>

          <div class="order-info">
            <h3> Shipping Information</h3>
            <p><strong>Name:</strong> ${shippingInfo.firstName} ${shippingInfo.lastName}</p>
            <p><strong>Email:</strong> ${shippingInfo.email}</p>
            <p><strong>Address:</strong> ${shippingInfo.address}</p>
            <p><strong>City:</strong> ${shippingInfo.city}</p>
            <p><strong>Postal Code:</strong> ${shippingInfo.zipCode}</p>
            <p><strong>Country:</strong> ${shippingInfo.country === 'TN' ? '🇹🇳 Tunisia' : shippingInfo.country}</p>
          </div>

          <div class="order-info">
            <h3> Payment Method</h3>
            <p>${paymentMethodToText(shippingInfo.paymentMethod)}</p>
          </div>

          <p>We'll notify you when your order ships.</p>
          
          <a href="${FRONTEND_URL}/orders/${orderId}" class="button">Track Your Order</a>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Voidstone Studio. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const getStoreEmailTemplate = (orderData: any) => {
  const { shippingInfo, items, cartTotal, orderId } = orderData;
  
  const itemsList = items.map((item: any) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">$${item.price}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Inter', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .header { background: black; padding: 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-weight: 600; letter-spacing: 2px; }
        .content { padding: 40px 30px; }
        .order-info { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #f0f0f0; padding: 12px; text-align: left; }
        td { padding: 12px; border-bottom: 1px solid #eee; }
        .total { font-size: 18px; font-weight: 600; text-align: right; margin-top: 20px; }
        .footer { background: #f9f9f9; padding: 20px; text-align: center; color: #666; font-size: 14px; }
        .highlight { background: #fff3cd; padding: 2px 8px; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1> NEW ORDER ALERT</h1>
        </div>
        <div class="content">
          <h2>New Order Received!</h2>
          
          <div class="order-info">
            <h3> Order Details</h3>
            <p><strong>Order ID:</strong> <span class="highlight">${orderId}</span></p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          </div>

          <h3> Customer Information</h3>
          <div class="order-info">
            <p><strong>Name:</strong> ${shippingInfo.firstName} ${shippingInfo.lastName}</p>
            <p><strong>Email:</strong> ${shippingInfo.email}</p>
          </div>

          <h3> Order Items</h3>
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
            <p><strong>Total Amount:</strong> $${cartTotal.toFixed(2)}</p>
          </div>

          <h3> Shipping Address</h3>
          <div class="order-info">
            <p>${shippingInfo.firstName} ${shippingInfo.lastName}</p>
            <p>${shippingInfo.address}</p>
            <p>${shippingInfo.city}, ${shippingInfo.zipCode}</p>
            <p>${shippingInfo.country === 'TN' ? '🇹🇳 Tunisia' : shippingInfo.country}</p>
          </div>

          <h3> Payment Method</h3>
          <div class="order-info">
            <p>${paymentMethodToText(shippingInfo.paymentMethod)}</p>
          </div>

          <p style="font-size: 18px; text-align: center; margin-top: 30px;">
            Process this order as soon as possible!
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Voidstone Studio Admin</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const paymentMethodToText = (method: string): string => {
  switch(method) {
    case 'credit_card': return ' Credit Card';
    case 'paypal': return '🅿 PayPal';
    case 'bank_transfer': return ' Bank Transfer';
    case 'cash_on_delivery': return ' Cash on Delivery';
    default: return method;
  }
};