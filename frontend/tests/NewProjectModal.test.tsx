import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NewProjectModal } from '../src/components/NewProjectModal';

// Mock the API request
jest.mock('../src/lib/api', () => ({
  apiRequest: jest.fn()
}));

import { apiRequest } from '../src/lib/api';
const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

describe('NewProjectModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onProjectCreated: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render when open', () => {
    render(<NewProjectModal {...defaultProps} />);
    
    expect(screen.getByText('✨ Create New Project')).toBeInTheDocument();
    expect(screen.getByLabelText(/project name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/project color/i)).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<NewProjectModal {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('✨ Create New Project')).not.toBeInTheDocument();
  });

  it('should require project name', async () => {
    render(<NewProjectModal {...defaultProps} />);
    
    const submitButton = screen.getByRole('button', { name: /create project/i });
    expect(submitButton).toBeDisabled();
  });

  it('should enable submit button when name is provided', async () => {
    const user = userEvent.setup();
    render(<NewProjectModal {...defaultProps} />);
    
    const nameInput = screen.getByLabelText(/project name/i);
    const submitButton = screen.getByRole('button', { name: /create project/i });
    
    await user.type(nameInput, 'Test Project');
    
    expect(submitButton).toBeEnabled();
  });

  it('should call onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(<NewProjectModal {...defaultProps} onClose={onClose} />);
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);
    
    expect(onClose).toHaveBeenCalled();
  });

  it('should submit form with correct data', async () => {
    const user = userEvent.setup();
    const mockResponse = {
      ok: true,
      json: async () => ({ id: 1, name: 'Test Project' })
    };
    mockApiRequest.mockResolvedValue(mockResponse as any);
    
    const onProjectCreated = jest.fn();
    const onClose = jest.fn();
    
    render(
      <NewProjectModal 
        {...defaultProps} 
        onProjectCreated={onProjectCreated}
        onClose={onClose}
      />
    );
    
    // Fill in form
    await user.type(screen.getByLabelText(/project name/i), 'Test Project');
    await user.type(screen.getByLabelText(/description/i), 'Test description');
    
    // Change color using the color hex input (the text input with placeholder)
    const colorInput = screen.getByPlaceholderText('#6366f1');
    await user.clear(colorInput);
    await user.type(colorInput, '#10b981');
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /create project/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockApiRequest).toHaveBeenCalledWith('/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Project',
          description: 'Test description',
          color: '#10b981'
        })
      });
    });
    
    expect(onProjectCreated).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('should handle API errors gracefully', async () => {
    const user = userEvent.setup();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockApiRequest.mockRejectedValue(new Error('API Error'));
    
    render(<NewProjectModal {...defaultProps} />);
    
    // Fill in form
    await user.type(screen.getByLabelText(/project name/i), 'Test Project');
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /create project/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to create project:', expect.any(Error));
    });
    
    consoleSpy.mockRestore();
  });
});