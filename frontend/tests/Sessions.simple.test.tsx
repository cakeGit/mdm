import { render, screen, waitFor } from '@testing-library/react';
import { SessionsView } from '../src/components/Sessions';

// Mock the API request
jest.mock('../src/lib/api', () => ({
  apiRequest: jest.fn()
}));

import { apiRequest } from '../src/lib/api';
const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

describe('SessionsView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders sessions view component', async () => {
    // Mock empty sessions response
    mockApiRequest.mockResolvedValue({
      ok: true,
      json: async () => []
    } as any);

    render(<SessionsView />);
    
    await waitFor(() => {
      expect(screen.getByText('Work Sessions')).toBeInTheDocument();
    });
  });

  test('displays log session button', async () => {
    mockApiRequest.mockResolvedValue({
      ok: true,
      json: async () => []
    } as any);

    render(<SessionsView />);
    
    await waitFor(() => {
      expect(screen.getByText('Log Session')).toBeInTheDocument();
    });
  });

  test('shows loading state initially', () => {
    // Mock slow API response
    mockApiRequest.mockImplementation(() => new Promise(resolve => 
      setTimeout(() => resolve({
        ok: true,
        json: async () => []
      } as any), 1000)
    ));
    
    render(<SessionsView />);
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test('handles empty sessions list', async () => {
    mockApiRequest.mockResolvedValue({
      ok: true,
      json: async () => []
    } as any);
    
    render(<SessionsView />);
    
    await waitFor(() => {
      expect(screen.getByText(/start working/i)).toBeInTheDocument();
    });
  });

  test('calls API on mount', async () => {
    mockApiRequest.mockResolvedValue({
      ok: true,
      json: async () => []
    } as any);
    
    render(<SessionsView />);
    
    await waitFor(() => {
      expect(mockApiRequest).toHaveBeenCalledWith('/api/sessions?filter=all');
    });
  });
});