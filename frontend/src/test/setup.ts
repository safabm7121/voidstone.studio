import '@testing-library/jest-dom';
import { afterEach, vi, expect } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';


// Extend Vitest's expect with testing-library matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
      post: vi.fn(),
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    })),
  },
  post: vi.fn(),
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  create: vi.fn(() => ({
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  })),
}));

// Mock MUI icons to avoid import issues
vi.mock('@mui/icons-material/Search', () => ({ default: () => null }));
vi.mock('@mui/icons-material/FilterList', () => ({ default: () => null }));
vi.mock('@mui/icons-material/ViewModule', () => ({ default: () => null }));
vi.mock('@mui/icons-material/ViewCarousel', () => ({ default: () => null }));
vi.mock('@mui/icons-material/AddShoppingCart', () => ({ default: () => null }));
vi.mock('@mui/icons-material/Delete', () => ({ default: () => null }));
vi.mock('@mui/icons-material/Edit', () => ({ default: () => null }));
vi.mock('@mui/icons-material/History', () => ({ default: () => null }));
vi.mock('@mui/icons-material/ArrowBack', () => ({ default: () => null }));
vi.mock('@mui/icons-material/Add', () => ({ default: () => null }));
vi.mock('@mui/icons-material/Remove', () => ({ default: () => null }));
vi.mock('@mui/icons-material/ShoppingBag', () => ({ default: () => null }));
vi.mock('@mui/icons-material/ShoppingCart', () => ({ default: () => null }));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock ResizeObserver
window.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock document.dir for RTL tests
Object.defineProperty(document, 'dir', {
  writable: true,
  value: 'ltr',
});