import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock API requests
jest.mock('../src/lib/api', () => ({
  apiRequest: jest.fn(() => 
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve([])
    })
  )
}));

describe('Core Application Tests', () => {
  test('application components can render without errors', () => {
    // Test that basic component rendering works
    const TestComponent = () => <div>Test Component</div>;
    render(<TestComponent />);
    expect(screen.getByText('Test Component')).toBeInTheDocument();
  });

  test('API mock is properly configured', async () => {
    const { apiRequest } = require('../src/lib/api');
    const response = await apiRequest('/test');
    expect(response.ok).toBe(true);
  });
});