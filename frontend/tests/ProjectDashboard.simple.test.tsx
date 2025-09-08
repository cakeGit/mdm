import { render, screen } from '@testing-library/react';
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
    progress: 30
  }
];

describe('ProjectDashboard Core Features', () => {
  const defaultProps = {
    projects: mockProjects,
    onProjectSelect: jest.fn(),
    onNewProject: jest.fn(),
    onRefresh: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render project name and description', () => {
    render(<ProjectDashboard {...defaultProps} />);
    
    expect(screen.getByText('Test Mod')).toBeInTheDocument();
    expect(screen.getByText('A test mod project')).toBeInTheDocument();
  });

  it('should show project status badge', () => {
    render(<ProjectDashboard {...defaultProps} />);
    
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('should display task progress', () => {
    render(<ProjectDashboard {...defaultProps} />);
    
    expect(screen.getByText('3/10 tasks')).toBeInTheDocument();
  });

  it('should have New Project button', () => {
    render(<ProjectDashboard {...defaultProps} />);
    
    expect(screen.getByRole('button', { name: /New Project/i })).toBeInTheDocument();
  });

  it('should call onNewProject when New Project button is clicked', async () => {
    const user = userEvent.setup();
    const onNewProject = jest.fn();
    
    render(<ProjectDashboard {...defaultProps} onNewProject={onNewProject} />);
    
    const newProjectButton = screen.getByRole('button', { name: /New Project/i });
    await user.click(newProjectButton);
    
    expect(onNewProject).toHaveBeenCalled();
  });

  it('should show empty state when no projects exist', () => {
    render(<ProjectDashboard {...defaultProps} projects={[]} />);
    
    expect(screen.getByText(/Ready to build something amazing/i)).toBeInTheDocument();
  });

  it('should display last updated timestamp', () => {
    render(<ProjectDashboard {...defaultProps} />);
    
    expect(screen.getByText(/Last updated/)).toBeInTheDocument();
  });
});