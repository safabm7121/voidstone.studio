import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Products from '../../pages/Products';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { CartProvider } from '../../context/CartContext';
import { productApi } from '../../services/api';
import { toast } from 'react-toastify';

// Mock toast
vi.mock('react-toastify', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'products.title': 'Our Collection',
        'products.search': 'Search products...',
        'products.category': 'Category',
        'products.sortBy': 'Sort By',
        'products.newest': 'Newest',
        'products.priceLow': 'Price: Low to High',
        'products.priceHigh': 'Price: High to Low',
        'products.nameAsc': 'Name: A to Z',
        'products.nameDesc': 'Name: Z to A',
        'products.priceFilter': 'Price Filter',
        'products.priceRange': 'Price Range',
        'products.productsFound': 'products found',
        'products.clearFilters': 'Clear Filters',
        'products.noProducts': 'No products found',
      };
      return translations[key] || key;
    },
    i18n: {
      language: 'en',
      dir: 'ltr',
    },
  }),
}));

// Mock the API
vi.mock('../../services/api', () => ({
  productApi: {
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockProducts = {
  data: {
    products: [
      {
        _id: '1',
        name: 'Product 1',
        description: 'Description 1',
        price: 99.99,
        category: 'Men',
        images: ['image1.jpg'],
        tags: ['tag1'],
        created_at: '2024-01-01',
        is_active: true,
      },
      {
        _id: '2',
        name: 'Product 2',
        description: 'Description 2',
        price: 149.99,
        category: 'Women',
        images: ['image2.jpg'],
        tags: ['tag2'],
        created_at: '2024-01-02',
        is_active: true,
      },
    ],
  },
};

// Mock contexts
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
    useCart: vi.fn().mockReturnValue({
      cart: [],
      addToCart: vi.fn(),
    }),
    CartProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

const renderWithProviders = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Products />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Products Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      isAuthenticated: true,
      user: { role: 'client' },
    });
    (productApi.get as any).mockResolvedValue(mockProducts);
  });

  it('renders loading state initially', () => {
    renderWithProviders();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders products after loading', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.getByText('Product 2')).toBeInTheDocument();
    });
  });

  it('filters products by search term', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search products...');
    fireEvent.change(searchInput, { target: { value: 'Product 1' } });

    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.queryByText('Product 2')).not.toBeInTheDocument();
  });

  it('filters products by category', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });

    // Get all comboboxes
    const comboboxes = screen.getAllByRole('combobox');
    // First combobox is category
    const categorySelect = comboboxes[0];
    
    fireEvent.mouseDown(categorySelect);
    
    // Wait for the menu to appear and select the Men option
    await waitFor(() => {
      // Use getAllByRole to get all options
      const options = screen.getAllByRole('option');
      // Find the Men option
      const menOption = options.find(option => option.textContent === 'Men');
      expect(menOption).toBeDefined();
      if (menOption) {
        fireEvent.click(menOption);
      }
    });

    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.queryByText('Product 2')).not.toBeInTheDocument();
  });

  it('sorts products by price low to high', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });

    // Get all comboboxes
    const comboboxes = screen.getAllByRole('combobox');
    // Second combobox is sort
    const sortSelect = comboboxes[1];
    
    fireEvent.mouseDown(sortSelect);
    
    // Wait for and click the price low option
    await waitFor(() => {
      // Use getAllByRole to get all options
      const options = screen.getAllByRole('option');
      // Find the Price: Low to High option
      const priceLowOption = options.find(option => option.textContent === 'Price: Low to High');
      expect(priceLowOption).toBeDefined();
      if (priceLowOption) {
        fireEvent.click(priceLowOption);
      }
    });

    // Get all product names in order
    const products = screen.getAllByText(/Product \d/);
    expect(products[0]).toHaveTextContent('Product 1');
    expect(products[1]).toHaveTextContent('Product 2');
  });

  it('toggles filter panel', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });

    const filterButton = screen.getByText('Price Filter');
    fireEvent.click(filterButton);

    expect(screen.getByText(/Price Range/i)).toBeInTheDocument();
  });

  it('clears all filters', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });

    // Apply a filter
    const searchInput = screen.getByPlaceholderText('Search products...');
    fireEvent.change(searchInput, { target: { value: 'Product 1' } });

    expect(screen.queryByText('Product 2')).not.toBeInTheDocument();

    // Clear filters
    const clearButton = screen.getByText('Clear Filters');
    fireEvent.click(clearButton);

    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('Product 2')).toBeInTheDocument();
  });

  it('handles empty product list', async () => {
    (productApi.get as any).mockResolvedValueOnce({ data: { products: [] } });

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('No products found')).toBeInTheDocument();
    });
  });

  it('handles API error', async () => {
    (productApi.get as any).mockRejectedValueOnce(new Error('API Error'));

    renderWithProviders();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load products');
    });

    // Verify that products are not rendered
    expect(screen.queryByText('Product 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Product 2')).not.toBeInTheDocument();
  });
});