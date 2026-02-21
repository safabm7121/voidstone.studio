import axios from 'axios';

interface OrderData {
  items: any[];
  shippingInfo: {
    firstName: string;
    lastName: string;
    email: string;
    address: string;
    city: string;
    zipCode: string;
    country: string;
    paymentMethod: string;
  };
  cartTotal: number;
  orderId: string;
  orderDate: string;
}

const AUTH_API_URL = 'http://localhost:3001/api';

export const sendOrderEmails = async (orderData: OrderData) => {
  try {
    console.log('📧 Sending order emails to backend...');
    
    const response = await axios.post(`${AUTH_API_URL}/orders/send-emails`, orderData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Order emails sent successfully via backend');
    return response.data;
    
  } catch (error) {
    console.error('❌ Error sending order emails:', error);
    // Fallback to console logging if backend fails
    console.log('📧 ========== EMAIL TO BUYER (FALLBACK) ==========');
    console.log('To:', orderData.shippingInfo.email);
    console.log('Subject:', `Order Confirmation - ${orderData.orderId}`);
    console.log('Order Details:', JSON.stringify(orderData, null, 2));
    
    console.log('📧 ========== EMAIL TO STORE (FALLBACK) ==========');
    console.log('To: voidstonestone@gmail.com');
    console.log('Subject:', `🛍️ New Order Received - ${orderData.orderId}`);
    console.log('Order Details:', JSON.stringify(orderData, null, 2));
    console.log('📧 ===================================');
    
    throw error;
  }
};

export const generateOrderId = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `VS-${timestamp}-${random}`;
};