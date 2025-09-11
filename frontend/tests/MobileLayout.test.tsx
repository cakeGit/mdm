import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Layout } from '@/components/layout/Layout';
import { AuthProvider } from '@/contexts/AuthContext';

const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
};

const MockAuthProvider = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <div data-testid="mock-auth-context">
      {children}
    </div>
  </AuthProvider>
);

// Mock the auth context to provide a user
jest.mock('@/contexts/AuthContext', () => ({
  ...jest.requireActual('@/contexts/AuthContext'),
  useAuth: () => ({
    user: mockUser,
    isLoading: false,
    login: jest.fn(),
    logout: jest.fn(),
  }),
}));

describe('Mobile Responsive Layout', () => {
  // Mock useSidebar for these tests
  beforeEach(() => {
    jest.doMock('@/hooks/useSidebar', () => ({
      useSidebar: () => ({
        isOpen: false,
        isMobile: true,
        toggle: jest.fn(),
        close: jest.fn(),
        open: jest.fn(),
      }),
    }));
    
    // Reset window width for each test
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
  });

  it('should show hamburger button on mobile', () => {
    render(
      <MockAuthProvider>
        <Layout activeView="dashboard">
          <div>Test content</div>
        </Layout>
      </MockAuthProvider>
    );

    expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument();
  });

  it('should show mobile header with mdm logo', () => {
    render(
      <MockAuthProvider>
        <Layout activeView="dashboard">
          <div>Test content</div>
        </Layout>
      </MockAuthProvider>
    );

    // Look for mdm text in the mobile header specifically
    const mobileHeaders = screen.getAllByText('mdm');
    expect(mobileHeaders.length).toBeGreaterThan(0);
  });

  it('should render main content', () => {
    render(
      <MockAuthProvider>
        <Layout activeView="dashboard">
          <div data-testid="test-content">Test content</div>
        </Layout>
      </MockAuthProvider>
    );

    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });
});

describe('Mobile Sidebar Toggle', () => {
  it('should show open menu button when sidebar is closed', () => {
    // Mock with sidebar closed
    jest.doMock('@/hooks/useSidebar', () => ({
      useSidebar: () => ({
        isOpen: false,
        isMobile: true,
        toggle: jest.fn(),
        close: jest.fn(),
        open: jest.fn(),
      }),
    }));

    render(
      <MockAuthProvider>
        <Layout activeView="dashboard">
          <div>Test content</div>
        </Layout>
      </MockAuthProvider>
    );

    // Should show open menu when closed
    expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument();
  });
});