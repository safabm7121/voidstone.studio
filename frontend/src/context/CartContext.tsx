import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext';
import { formatCurrency } from '../utils/helpers';

// Simplified CartItem - NO IMAGES stored!
interface CartItem {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
  // Store only a flag that image exists, not the actual base64
  hasImage?: boolean;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: any, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  formattedCartTotal: string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

// Helper to safely load cart from localStorage
const loadCartFromStorage = (): CartItem[] => {
  try {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      return JSON.parse(savedCart);
    }
  } catch (error) {
    console.error('Error loading cart from localStorage:', error);
    localStorage.removeItem('cart');
  }
  return [];
};

// Helper to safely save cart to localStorage with quota handling
const saveCartToStorage = (cart: CartItem[]) => {
  try {
    const cartString = JSON.stringify(cart);
    // Check size before saving (warn if approaching limit)
    if (cartString.length > 4_000_000) { // ~4MB warning threshold
      console.warn('Cart is getting large:', Math.round(cartString.length / 1024 / 1024), 'MB');
    }
    localStorage.setItem('cart', cartString);
  } catch (error) {
    console.error('Error saving cart to localStorage:', error);
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      toast.error('Cart is too large. Please remove some items or clear your cart.');
    }
  }
};

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(loadCartFromStorage);
  const { isAuthenticated } = useAuth();

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    saveCartToStorage(cart);
  }, [cart]);

  const addToCart = (product: any, quantity: number = 1) => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item._id === product._id);

      // Create a minimal cart item - NO BASE64 IMAGES!
      const cartItem: CartItem = {
        _id: product._id,
        name: product.name,
        price: product.price,
        quantity: existingItem ? existingItem.quantity + quantity : quantity,
        category: product.category,
        hasImage: product.images?.length > 0 // Just store a flag, not the actual image
      };

      if (existingItem) {
        const updatedCart = prevCart.map(item =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
        toast.success(
          <span>
            Updated <strong>{product.name}</strong> quantity<br />
            <small>Total: {formatCurrency((existingItem.quantity + quantity) * product.price)}</small>
          </span>
        );
        return updatedCart;
      } else {
        toast.success(
          <span>
            <strong>{product.name}</strong> added to cart<br />
            <small>Price: {formatCurrency(product.price)}</small>
          </span>
        );
        return [...prevCart, cartItem];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => {
      const item = prevCart.find(item => item._id === productId);
      if (item) {
        toast.info(
          <span>
            <strong>{item.name}</strong> removed from cart<br />
            <small>Saved: {formatCurrency(item.price * item.quantity)}</small>
          </span>
        );
      }
      return prevCart.filter(item => item._id !== productId);
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item._id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    toast.info('Cart cleared');
  };

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);
  const formattedCartTotal = formatCurrency(cartTotal);

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartTotal,
      cartCount,
      formattedCartTotal
    }}>
      {children}
    </CartContext.Provider>
  );
};