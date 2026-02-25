import axios from 'axios';

// Update the interface to include the fields you're actually sending
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
  // Make these optional since they might not be in the original interface
  subtotal?: number;
  deliveryFee?: number;
}

const AUTH_API_URL = 'http://localhost:3001/api';

export const sendOrderEmails = async (orderData: OrderData) => {
  try {
    console.log('📧 Sending order emails to backend...');
    console.log('Order data being sent:', JSON.stringify(orderData, null, 2));
    
    const response = await axios.post(`${AUTH_API_URL}/orders/send-emails`, orderData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Order emails sent successfully via backend');
    return response.data;
    
  } catch (error) {
    console.error('❌ Error sending order emails:', error);
    
    // Log more details about the error
    if (axios.isAxiosError(error)) {
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      console.error('Response headers:', error.response?.headers);
    }
    
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