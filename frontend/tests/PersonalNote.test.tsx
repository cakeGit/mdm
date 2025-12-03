import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { PersonalNote } from '@/components/PersonalNote';
import { apiRequest } from '@/lib/api';

// Mock the apiRequest function
jest.mock('@/lib/api', () => ({
  apiRequest: jest.fn()
}));

const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

describe('PersonalNote', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should render loading state initially', () => {
    mockApiRequest.mockImplementation(() => 
      new Promise(() => {}) // Never resolves
    );

    const { container } = render(<PersonalNote />);
    
    // Check that the loading skeleton is present
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('should fetch and display existing note', async () => {
    const mockNote = {
      content: 'My existing thought',
      updated_at: '2024-01-01T00:00:00Z'
    };

    mockApiRequest.mockResolvedValueOnce({
      json: async () => mockNote
    } as Response);

    render(<PersonalNote />);

    await waitFor(() => {
      const textarea = screen.getByPlaceholderText(/Jot down your thoughts.../i);
      expect(textarea).toHaveValue('My existing thought');
    });
  });

  it('should display empty note when no note exists', async () => {
    mockApiRequest.mockResolvedValueOnce({
      json: async () => ({ content: '', updated_at: null })
    } as Response);

    render(<PersonalNote />);

    await waitFor(() => {
      const textarea = screen.getByPlaceholderText(/Jot down your thoughts.../i);
      expect(textarea).toHaveValue('');
    });
  });

  it('should autosave note after typing stops', async () => {
    // Initial fetch
    mockApiRequest.mockResolvedValueOnce({
      json: async () => ({ content: '', updated_at: null })
    } as Response);

    // Save request
    mockApiRequest.mockResolvedValueOnce({
      json: async () => ({ content: 'New thought', updated_at: '2024-01-01T00:00:00Z' })
    } as Response);

    render(<PersonalNote />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Jot down your thoughts.../i)).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText(/Jot down your thoughts.../i);
    
    // Type in the textarea
    fireEvent.change(textarea, { target: { value: 'New thought' } });

    // Fast-forward time by 1 second (autosave delay)
    jest.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(mockApiRequest).toHaveBeenCalledWith(
        '/api/personal-note',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ content: 'New thought' })
        })
      );
    });
  });

  it('should debounce multiple rapid changes', async () => {
    // Initial fetch
    mockApiRequest.mockResolvedValueOnce({
      json: async () => ({ content: '', updated_at: null })
    } as Response);

    // Save request (should only be called once)
    mockApiRequest.mockResolvedValueOnce({
      json: async () => ({ content: 'Final text', updated_at: '2024-01-01T00:00:00Z' })
    } as Response);

    render(<PersonalNote />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Jot down your thoughts.../i)).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText(/Jot down your thoughts.../i);
    
    // Type multiple times rapidly
    fireEvent.change(textarea, { target: { value: 'F' } });
    jest.advanceTimersByTime(500);
    
    fireEvent.change(textarea, { target: { value: 'Fi' } });
    jest.advanceTimersByTime(500);
    
    fireEvent.change(textarea, { target: { value: 'Final text' } });
    jest.advanceTimersByTime(1000);

    await waitFor(() => {
      // Should only have made 2 API calls: 1 fetch + 1 save (debounced)
      expect(mockApiRequest).toHaveBeenCalledTimes(2);
    });
  });

  it('should show "Saving..." indicator during save', async () => {
    // Initial fetch
    mockApiRequest.mockResolvedValueOnce({
      json: async () => ({ content: '', updated_at: null })
    } as Response);

    // Save request with delay
    mockApiRequest.mockImplementationOnce(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          json: async () => ({ content: 'Test', updated_at: '2024-01-01T00:00:00Z' })
        } as Response), 100)
      )
    );

    render(<PersonalNote />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Jot down your thoughts.../i)).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText(/Jot down your thoughts.../i);
    fireEvent.change(textarea, { target: { value: 'Test' } });

    // Fast-forward to trigger save
    jest.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(screen.getByText(/Saving.../i)).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    // Initial fetch fails
    mockApiRequest.mockRejectedValueOnce(new Error('Network error'));

    render(<PersonalNote />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to fetch personal note:',
        expect.any(Error)
      );
    });

    consoleErrorSpy.mockRestore();
  });
});
