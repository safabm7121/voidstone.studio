import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Cart from '../../pages/Cart';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { CartProvider, useCart } from '../../context/CartContext';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'auth.login': 'Login',
        'cart.loginRequired': 'Please login to view your cart',
        'cart.empty': 'Your cart is empty',
        'cart.emptyMessage': 'Looks like you haven\'t added anything yet',
        'cart.continueShopping': 'Continue Shopping',
        'cart.title': 'Shopping Cart',
        'cart.each': 'each',
        'cart.subtotal': 'Subtotal',
        'cart.items': 'items',
        'cart.shipping': 'Shipping',
        'cart.free': 'Free',
        'cart.tax': 'Tax',
        'cart.calculated': 'Calculated at checkout',
        'cart.total': 'Total',
        'cart.checkout': 'Checkout',
        'cart.secureCheckout': 'Secure checkout',
        'cart.clearCart': 'Clear Cart',
        'cart.orderSummary': 'Order Summary',
      };
      return translations[key] || key;
    },
    i18n: {
      language: 'en',
      dir: 'ltr',
    },
  }),
}));

// Mock the contexts
vi.mock('../../context/AuthContext', async () => {
  const actual = await vi.importActual('../../context/AuthContext');
  return {
    ...actual,
    useAuth: vi.fn(),
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

vi.mock('../../context/CartContext', async () => {
  const actual = await vi.importActual('../../context/CartContext');
  return {
    ...actual,
    useCart: vi.fn(),
    CartProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

const mockCartItems = [
  {
    _id: '1',
    name: 'Product 1',
    price: 99.99,
    quantity: 2,
    images: ['image1.jpg'],
    category: 'Men',
  },
  {
    _id: '2',
    name: 'Product 2',
    price: 149.99,
    quantity: 1,
    images: ['image2.jpg'],
    category: 'Women',
  },
];

const mockUpdateQuantity = vi.fn();
const mockRemoveFromCart = vi.fn();
const mockClearCart = vi.fn();

const renderWithProviders = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Cart />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Cart Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', firstName: 'Test', lastName: 'User' },
    });
    (useCart as any).mockReturnValue({
      cart: mockCartItems,
      updateQuantity: mockUpdateQuantity,
      removeFromCart: mockRemoveFromCart,
      clearCart: mockClearCart,
      cartTotal: 99.99 * 2 + 149.99,
      cartCount: 3,
      formattedCartTotal: '349.970 DT',
    });
  });

  it('renders cart items correctly', () => {
    renderWithProviders();

    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('Product 2')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('displays order summary correctly', () => {
    renderWithProviders();

    expect(screen.getByText(/subtotal.*2 items/i)).toBeInTheDocument();
    expect(screen.getByText('Free')).toBeInTheDocument();
  });

  it('handles quantity increase', () => {
    renderWithProviders();

    // Find all buttons in the first cart item
    const product1Buttons = screen.getAllByRole('button').slice(0, 3);
    // The increase button is the second button (index 1)
    fireEvent.click(product1Buttons[1]);

    expect(mockUpdateQuantity).toHaveBeenCalledWith('1', 3);
  });

  it('handles quantity decrease', () => {
    renderWithProviders();

    const product1Buttons = screen.getAllByRole('button').slice(0, 3);
    // The decrease button is the first button (index 0)
    fireEvent.click(product1Buttons[0]);

    expect(mockUpdateQuantity).toHaveBeenCalledWith('1', 1);
  });

  it('handles item removal', () => {
    renderWithProviders();

    const product1Buttons = screen.getAllByRole('button').slice(0, 3);
    // The delete button is the third button (index 2)
    fireEvent.click(product1Buttons[2]);

    expect(mockRemoveFromCart).toHaveBeenCalledWith('1');
  });

  it('handles clear cart', () => {
    renderWithProviders();

    const clearButton = screen.getByText('Clear Cart');
    fireEvent.click(clearButton);

    expect(mockClearCart).toHaveBeenCalled();
  });

  it('shows login required message when not authenticated', () => {
    (useAuth as any).mockReturnValue({
      isAuthenticated: false,
      user: null,
    });

    renderWithProviders();

    expect(screen.getByText('Please login to view your cart')).toBeInTheDocument();
  });

  it('shows empty cart message when cart is empty', () => {
    (useCart as any).mockReturnValue({
      cart: [],
      updateQuantity: mockUpdateQuantity,
      removeFromCart: mockRemoveFromCart,
      clearCart: mockClearCart,
      cartTotal: 0,
      cartCount: 0,
      formattedCartTotal: '0.000 DT',
    });

    renderWithProviders();

    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
  });
});