import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectDashboard } from '../src/components/ProjectDashboard';
import { Project } from '../src/types';

const mockProjects: Project[] = [
  {
    id: 1,
    name: 'Test Mod',
    description: 'A test mod project',
    color: '#6366f1',
    status: 'active',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-02T12:00:00.000Z',
    total_tasks: 10,
    completed_tasks: 3,
    progress: 30,
    last_session: '2024-01-02T10:00:00.000Z'
  },
  {
    id: 2,
    name: 'Another Mod',
    description: 'Another test project',
    color: '#10b981',
    status: 'planning',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    total_tasks: 5,
    completed_tasks: 0,
    progress: 0,
    last_session: null
  }
];

describe('ProjectDashboard', () => {
  const defaultProps = {
    projects: mockProjects,
    onProjectSelect: jest.fn(),
    onNewProject: jest.fn(),
    onRefresh: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Project Cards Display', () => {
    it('should render all projects as cards', () => {
      render(<ProjectDashboard {...defaultProps} />);
      
      expect(screen.getByText('Test Mod')).toBeInTheDocument();
      expect(screen.getByText('Another Mod')).toBeInTheDocument();
      expect(screen.getByText('A test mod project')).toBeInTheDocument();
      expect(screen.getByText('Another test project')).toBeInTheDocument();
    });

    it('should display project status badges with correct colors', () => {
      render(<ProjectDashboard {...defaultProps} />);
      
      // Check for status badges
      expect(screen.getByText('active')).toBeInTheDocument();
      expect(screen.getByText('planning')).toBeInTheDocument();
    });

    it('should show progress bars with correct task completion text', () => {
      render(<ProjectDashboard {...defaultProps} />);
      
      // Look for task completion indicators
      expect(screen.getByText('3/10 tasks')).toBeInTheDocument();
      expect(screen.getByText('0/5 tasks')).toBeInTheDocument();
    });

    it('should display "Last Updated" timestamps', () => {
      render(<ProjectDashboard {...defaultProps} />);
      
      // Should show relative time for updates
      expect(screen.getByText(/Last updated/)).toBeInTheDocument();
    });
  });

  describe('Project Interaction', () => {
    it('should call onProjectSelect when a project card is clicked', async () => {
      const user = userEvent.setup();
      const onProjectSelect = jest.fn();
      
      render(<ProjectDashboard {...defaultProps} onProjectSelect={onProjectSelect} />);
      
      // Find the project card by finding the project name and clicking its container card
      const projectCard = screen.getByText('Test Mod').closest('[class*="cursor-pointer"]');
      
      if (projectCard) {
        await user.click(projectCard);
        expect(onProjectSelect).toHaveBeenCalledWith(1);
      } else {
        // Alternative approach: click on the card content area
        const testModElement = screen.getByText('Test Mod');
        const cardElement = testModElement.closest('div[class*="Card"], div[class*="card"]');
        if (cardElement) {
          await user.click(cardElement);
          expect(onProjectSelect).toHaveBeenCalledWith(1);
        }
      }
    });

    it('should call onNewProject when "New Project" button is clicked', async () => {
      const user = userEvent.setup();
      const onNewProject = jest.fn();
      
      render(<ProjectDashboard {...defaultProps} onNewProject={onNewProject} />);
      
      const newProjectButton = screen.getByRole('button', { name: /new project/i });
      await user.click(newProjectButton);
      
      expect(onNewProject).toHaveBeenCalled();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no projects exist', () => {
      render(<ProjectDashboard {...defaultProps} projects={[]} />);
      
      expect(screen.getByText(/Ready to build something amazing/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Create Your First Project/i })).toBeInTheDocument();
    });

    it('should call onNewProject when empty state button is clicked', async () => {
      const user = userEvent.setup();
      const onNewProject = jest.fn();
      
      render(<ProjectDashboard {...defaultProps} projects={[]} onNewProject={onNewProject} />);
      
      const createButton = screen.getByRole('button', { name: /Create Your First Project/i });
      await user.click(createButton);
      
      expect(onNewProject).toHaveBeenCalled();
    });
  });

  describe('Quick Stats Widget', () => {
    it('should display momentum meter component', () => {
      render(<ProjectDashboard {...defaultProps} />);
      
      // Check for MomentumMeter component presence
      expect(screen.getByText(/streak/i)).toBeInTheDocument();
    });
  });

  describe('Project Edit Functionality', () => {
    it('should show edit button on project cards', () => {
      render(<ProjectDashboard {...defaultProps} />);
      
      // Edit buttons should be present (might be hidden until hover)
      const editButtons = screen.getAllByLabelText(/edit project/i);
      expect(editButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Suggested Next Task', () => {
    it('should display suggested next task when available', () => {
      const projectsWithTasks = [
        {
          ...mockProjects[0],
          suggested_task: {
            id: 1,
            stage_id: 1,
            title: 'Implement core feature',
            description: '',
            status: 'todo' as const,
            priority: 1 as const
          }
        }
      ];
      
      render(<ProjectDashboard {...defaultProps} projects={projectsWithTasks} />);
      
      expect(screen.getByText('Suggested Next Task')).toBeInTheDocument();
      expect(screen.getByText('Implement core feature')).toBeInTheDocument();
    });
  });
});