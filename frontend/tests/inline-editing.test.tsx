import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProjectDetail } from '../src/components/ProjectDetail';
import * as api from '../src/lib/api';

// Mock the API
jest.mock('../src/lib/api');
const mockApiRequest = api.apiRequest as jest.MockedFunction<typeof api.apiRequest>;

const mockProject = {
  id: 1,
  name: 'Test Project',
  description: 'Test project description',
  status: 'active',
  color: '#3b82f6',
  stages: [
    {
      id: 1,
      name: 'Planning Stage',
      description: 'Planning stage description',
      project_id: 1,
      sort_order: 0,
      is_completed: false,
      tasks: [
        {
          id: 1,
          title: 'Test Task',
          description: 'Test task description',
          status: 'todo',
          priority: 1,
          stage_id: 1,
          is_pinned: false,
          created_at: '2024-01-01T00:00:00Z',
          completed_at: null
        }
      ]
    }
  ]
};

describe('Inline Editing Features', () => {
  const mockOnBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockApiRequest.mockResolvedValue({
      ok: true,
      json: async () => mockProject
    } as Response);
  });

  test('should allow inline editing of project name', async () => {
    render(<ProjectDetail projectId={1} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    // Click on project name to edit
    const projectName = screen.getByText('Test Project');
    fireEvent.click(projectName);

    // Should show input field
    const input = screen.getByDisplayValue('Test Project');
    expect(input).toBeInTheDocument();

    // Change the name
    fireEvent.change(input, { target: { value: 'Updated Project Name' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // Should call API to update
    await waitFor(() => {
      expect(mockApiRequest).toHaveBeenCalledWith('/api/projects/1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated Project Name' })
      });
    });
  });

  test('should allow inline editing of project description', async () => {
    render(<ProjectDetail projectId={1} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Test project description')).toBeInTheDocument();
    });

    // Click on project description to edit
    const description = screen.getByText('Test project description');
    fireEvent.click(description);

    // Should show input field
    const input = screen.getByDisplayValue('Test project description');
    expect(input).toBeInTheDocument();

    // Change the description
    fireEvent.change(input, { target: { value: 'Updated description' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // Should call API to update
    await waitFor(() => {
      expect(mockApiRequest).toHaveBeenCalledWith('/api/projects/1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: 'Updated description' })
      });
    });
  });

  test('should allow inline editing of stage name', async () => {
    render(<ProjectDetail projectId={1} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Planning Stage')).toBeInTheDocument();
    });

    // Click on stage name to edit (need to stop propagation)
    const stageName = screen.getByText('Planning Stage');
    fireEvent.click(stageName);

    // Should show input field
    const input = screen.getByDisplayValue('Planning Stage');
    expect(input).toBeInTheDocument();

    // Change the name
    fireEvent.change(input, { target: { value: 'Updated Stage Name' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // Should call API to update
    await waitFor(() => {
      expect(mockApiRequest).toHaveBeenCalledWith('/api/stages/1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated Stage Name' })
      });
    });
  });

  test('should allow inline editing of task title', async () => {
    render(<ProjectDetail projectId={1} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    // Click on task title to edit
    const taskTitle = screen.getByText('Test Task');
    fireEvent.click(taskTitle);

    // Should show input field
    const input = screen.getByDisplayValue('Test Task');
    expect(input).toBeInTheDocument();

    // Change the title
    fireEvent.change(input, { target: { value: 'Updated Task Title' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // Should call API to update
    await waitFor(() => {
      expect(mockApiRequest).toHaveBeenCalledWith('/api/tasks/1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated Task Title' })
      });
    });
  });

  test('should cancel editing on Escape key', async () => {
    render(<ProjectDetail projectId={1} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    // Click on project name to edit
    const projectName = screen.getByText('Test Project');
    fireEvent.click(projectName);

    // Should show input field
    const input = screen.getByDisplayValue('Test Project');
    expect(input).toBeInTheDocument();

    // Press Escape to cancel
    fireEvent.keyDown(input, { key: 'Escape' });

    // Should not call API and should show original text
    expect(mockApiRequest).not.toHaveBeenCalledWith('/api/projects/1', expect.objectContaining({
      method: 'PATCH'
    }));
    
    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });
  });
});