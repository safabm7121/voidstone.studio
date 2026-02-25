import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProductCard from '../../components/products/ProductCard';

// Mock the hooks
vi.mock('../../hooks/useIntersectionObserver', () => ({
  useIntersectionObserver: () => ({
    elementRef: { current: null },
    isVisible: true,
  }),
}));

// Mock the contexts with hoisted variables
const { mockAddToCart, mockUseAuth } = vi.hoisted(() => {
  return {
    mockAddToCart: vi.fn(),
    mockUseAuth: vi.fn(),
  };
});

vi.mock('../../context/AuthContext', () => ({
  useAuth: mockUseAuth,
}));

vi.mock('../../context/CartContext', () => ({
  useCart: () => ({
    addToCart: mockAddToCart,
  }),
}));

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'common.back': 'Back',
        'product.addToCart': 'Add to Cart',
        'product.outOfStock': 'Out of Stock',
        'product.loginRequired': 'Please login to add items',
        'auth.login': 'Login',
        'product.quantity': 'Quantity',
        'product.category': 'Category',
        'product.designer': 'Designer',
        'product.stock': 'Stock',
        'product.available': 'available',
        'product.defaultDesigner': 'Voidstone Studio',
      };
      return translations[key] || key;
    },
    i18n: {
      language: 'en',
      dir: 'ltr',
    },
  }),
}));

const mockProduct = {
  _id: '123',
  name: 'Test Product',
  description: 'This is a test product description',
  price: 99.99,
  category: 'test-category',
  designer: 'Test Designer',
  stock_quantity: 10,
  images: ['test-image.jpg'],
  tags: ['test', 'product'],
  is_active: true,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
};

const renderWithProviders = (component: React.ReactNode) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('ProductCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { role: 'client' },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders product information correctly', () => {
    renderWithProviders(<ProductCard product={mockProduct} />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('This is a test product description')).toBeInTheDocument();
    expect(screen.getByText('test-category')).toBeInTheDocument();
    expect(screen.getByText('99,990 DT')).toBeInTheDocument(); // FIXED: comma instead of dot
    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('product')).toBeInTheDocument();
  });

  it('shows admin actions when isAdmin is true', () => {
    renderWithProviders(<ProductCard product={mockProduct} isAdmin={true} />);

    expect(screen.getByLabelText('View History')).toBeInTheDocument();
    expect(screen.getByLabelText('Edit')).toBeInTheDocument();
    expect(screen.getByLabelText('Delete')).toBeInTheDocument();
  });

  it('hides admin actions when isAdmin is false', () => {
    renderWithProviders(<ProductCard product={mockProduct} isAdmin={false} />);

    expect(screen.queryByLabelText('View History')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Delete')).not.toBeInTheDocument();
  });

  it('calls onDelete when delete button is clicked', () => {
    const handleDelete = vi.fn();
    renderWithProviders(
      <ProductCard 
        product={mockProduct} 
        isAdmin={true} 
        onDelete={handleDelete} 
      />
    );

    const deleteButton = screen.getByLabelText('Delete');
    fireEvent.click(deleteButton);

    expect(handleDelete).toHaveBeenCalledWith(mockProduct);
  });

  it('calls onEdit when edit button is clicked', () => {
    const handleEdit = vi.fn();
    renderWithProviders(
      <ProductCard 
        product={mockProduct} 
        isAdmin={true} 
        onEdit={handleEdit} 
      />
    );

    const editButton = screen.getByLabelText('Edit');
    fireEvent.click(editButton);

    expect(handleEdit).toHaveBeenCalledWith(mockProduct);
  });

  it('calls onViewHistory when history button is clicked', () => {
    const handleViewHistory = vi.fn();
    renderWithProviders(
      <ProductCard 
        product={mockProduct} 
        isAdmin={true} 
        onViewHistory={handleViewHistory} 
      />
    );

    const historyButton = screen.getByLabelText('View History');
    fireEvent.click(historyButton);

    expect(handleViewHistory).toHaveBeenCalledWith(mockProduct);
  });

  it('disables add to cart button when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
    });

    renderWithProviders(<ProductCard product={mockProduct} />);

    // FIXED: Button has title "Login to add" when disabled
    const addToCartButton = screen.getByRole('button', { name: /login to add/i });
    expect(addToCartButton).toBeDisabled();
  });

  it('has a link to product details page', () => {
    renderWithProviders(<ProductCard product={mockProduct} />);

    const link = screen.getByRole('link', { name: /test product/i });
    expect(link).toHaveAttribute('href', '/products/123');
  });
});