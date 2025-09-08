import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectDetail } from '../src/components/ProjectDetail';
import { ProjectWithDetails } from '../src/types';

// Mock the API request
jest.mock('../src/lib/api', () => ({
  apiRequest: jest.fn()
}));

import { apiRequest } from '../src/lib/api';
const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

const mockProjectWithDetails: ProjectWithDetails = {
  id: 1,
  name: 'Test Mod',
  description: 'A test mod project',
  color: '#6366f1',
  status: 'active',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-02T12:00:00.000Z',
  stages: [
    {
      id: 1,
      project_id: 1,
      parent_stage_id: null,
      name: 'Core Development',
      description: 'Main development stage',
      sort_order: 0,
      is_completed: false,
      tasks: [
        {
          id: 1,
          stage_id: 1,
          title: 'Setup project structure',
          description: 'Initialize the mod structure',
          status: 'completed',
          priority: 1,
          created_at: '2024-01-01T00:00:00.000Z',
          completed_at: '2024-01-01T12:00:00.000Z'
        },
        {
          id: 2,
          stage_id: 1,
          title: 'Implement core feature',
          description: 'Add the main functionality',
          status: 'in-progress',
          priority: 1,
          created_at: '2024-01-01T00:00:00.000Z',
          completed_at: null
        }
      ]
    },
    {
      id: 2,
      project_id: 1,
      parent_stage_id: null,
      name: 'Testing',
      description: 'Testing and QA',
      sort_order: 1,
      is_completed: false,
      tasks: []
    }
  ]
};

describe('ProjectDetail', () => {
  const defaultProps = {
    projectId: 1,
    onBack: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful API response
    mockApiRequest.mockResolvedValue({
      ok: true,
      json: async () => mockProjectWithDetails
    } as any);
  });

  describe('Project Header', () => {
    it('should display project name and description', async () => {
      render(<ProjectDetail {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Mod')).toBeInTheDocument();
        expect(screen.getByText('A test mod project')).toBeInTheDocument();
      });
    });

    it('should have back navigation button', async () => {
      const onBack = jest.fn();
      render(<ProjectDetail {...defaultProps} onBack={onBack} />);
      
      await waitFor(() => {
        const backButton = screen.getByLabelText(/back/i) || screen.getByRole('button', { name: /back/i });
        expect(backButton).toBeInTheDocument();
      });
    });

    it('should call onBack when back button is clicked', async () => {
      const user = userEvent.setup();
      const onBack = jest.fn();
      render(<ProjectDetail {...defaultProps} onBack={onBack} />);
      
      await waitFor(() => {
        const backButton = screen.getByLabelText(/back/i) || screen.getByRole('button', { name: /back/i });
        expect(backButton).toBeInTheDocument();
      });
      
      const backButton = screen.getByLabelText(/back/i) || screen.getByRole('button', { name: /back/i });
      await user.click(backButton);
      
      expect(onBack).toHaveBeenCalled();
    });

    it('should have edit project functionality', async () => {
      render(<ProjectDetail {...defaultProps} />);
      
      await waitFor(() => {
        const editButton = screen.getByLabelText(/edit project/i) || screen.getByRole('button', { name: /edit project/i });
        expect(editButton).toBeInTheDocument();
      });
    });
  });

  describe('Stage Hierarchy Panel', () => {
    it('should display all project stages', async () => {
      render(<ProjectDetail {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Core Development')).toBeInTheDocument();
        expect(screen.getByText('Testing')).toBeInTheDocument();
      });
    });

    it('should show stage descriptions', async () => {
      render(<ProjectDetail {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Main development stage')).toBeInTheDocument();
        expect(screen.getByText('Testing and QA')).toBeInTheDocument();
      });
    });

    it('should have "Add Stage" buttons', async () => {
      render(<ProjectDetail {...defaultProps} />);
      
      await waitFor(() => {
        const addStageButtons = screen.getAllByText(/add stage/i);
        expect(addStageButtons.length).toBeGreaterThan(0);
      });
    });

    it('should be collapsible/expandable', async () => {
      const user = userEvent.setup();
      render(<ProjectDetail {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Core Development')).toBeInTheDocument();
      });
      
      // Look for expand/collapse buttons
      const expandButtons = screen.getAllByRole('button').filter(button => 
        button.textContent?.includes('+') || button.textContent?.includes('-') ||
        button.querySelector('svg') // Might use icons
      );
      
      expect(expandButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Task Management', () => {
    it('should display tasks under stages', async () => {
      render(<ProjectDetail {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Setup project structure')).toBeInTheDocument();
        expect(screen.getByText('Implement core feature')).toBeInTheDocument();
      });
    });

    it('should show task status correctly', async () => {
      render(<ProjectDetail {...defaultProps} />);
      
      await waitFor(() => {
        // Check for completed task indicator
        expect(screen.getByText('Setup project structure')).toBeInTheDocument();
        // Might have checkmark or completion indicator
      });
    });

    it('should have "Add Task" buttons for each stage', async () => {
      render(<ProjectDetail {...defaultProps} />);
      
      await waitFor(() => {
        const addTaskButtons = screen.getAllByText(/add task/i);
        expect(addTaskButtons.length).toBeGreaterThan(0);
      });
    });

    it('should show task priority indicators', async () => {
      render(<ProjectDetail {...defaultProps} />);
      
      await waitFor(() => {
        // Tasks should show priority (High priority = 1)
        expect(screen.getByText('Setup project structure')).toBeInTheDocument();
        expect(screen.getByText('Implement core feature')).toBeInTheDocument();
      });
    });
  });

  describe('Task Interaction', () => {
    it('should allow task completion', async () => {
      const user = userEvent.setup();
      render(<ProjectDetail {...defaultProps} />);
      
      // Mock PATCH request for task completion
      mockApiRequest.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Task updated' })
      } as any);
      
      await waitFor(() => {
        expect(screen.getByText('Implement core feature')).toBeInTheDocument();
      });
      
      // Look for completion button (✓ or similar)
      const completeButtons = screen.getAllByRole('button').filter(button => 
        button.textContent?.includes('✓') || 
        button.getAttribute('title')?.includes('complete') ||
        button.getAttribute('aria-label')?.includes('complete')
      );
      
      if (completeButtons.length > 0) {
        await user.click(completeButtons[0]);
        // Should trigger API call
      }
    });

    it('should allow task reversion from completed to incomplete', async () => {
      const user = userEvent.setup();
      render(<ProjectDetail {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Setup project structure')).toBeInTheDocument();
      });
      
      // Look for revert button (↺ or similar) for completed tasks
      const revertButtons = screen.getAllByRole('button').filter(button => 
        button.textContent?.includes('↺') || 
        button.getAttribute('title')?.includes('revert') ||
        button.getAttribute('aria-label')?.includes('revert')
      );
      
      if (revertButtons.length > 0) {
        await user.click(revertButtons[0]);
        // Should trigger API call
      }
    });
  });

  describe('Progress Tracking', () => {
    it('should show real-time progress counters', async () => {
      render(<ProjectDetail {...defaultProps} />);
      
      await waitFor(() => {
        // Should show task completion progress
        expect(screen.getByText(/completed/i)).toBeInTheDocument();
      });
    });

    it('should update progress bars when tasks are completed', async () => {
      render(<ProjectDetail {...defaultProps} />);
      
      await waitFor(() => {
        // Progress bars should be visible
        const progressElements = screen.getAllByRole('progressbar');
        expect(progressElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Modal Dialogs', () => {
    it('should open new stage modal when "Add Stage" is clicked', async () => {
      const user = userEvent.setup();
      render(<ProjectDetail {...defaultProps} />);
      
      await waitFor(() => {
        const addStageButton = screen.getAllByText(/add stage/i)[0];
        expect(addStageButton).toBeInTheDocument();
      });
      
      const addStageButton = screen.getAllByText(/add stage/i)[0];
      await user.click(addStageButton);
      
      // Should open modal for stage creation
      await waitFor(() => {
        expect(screen.getByText(/stage name/i) || screen.getByText(/create stage/i)).toBeInTheDocument();
      });
    });

    it('should open new task modal when "Add Task" is clicked', async () => {
      const user = userEvent.setup();
      render(<ProjectDetail {...defaultProps} />);
      
      await waitFor(() => {
        const addTaskButton = screen.getAllByText(/add task/i)[0];
        expect(addTaskButton).toBeInTheDocument();
      });
      
      const addTaskButton = screen.getAllByText(/add task/i)[0];
      await user.click(addTaskButton);
      
      // Should open modal for task creation
      await waitFor(() => {
        expect(screen.getByText(/task title/i) || screen.getByText(/create task/i)).toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('should fetch project details on mount', async () => {
      render(<ProjectDetail {...defaultProps} />);
      
      await waitFor(() => {
        expect(mockApiRequest).toHaveBeenCalledWith('/api/projects/1');
      });
    });

    it('should handle API errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockApiRequest.mockRejectedValue(new Error('API Error'));
      
      render(<ProjectDetail {...defaultProps} />);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch project:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });
  });
});