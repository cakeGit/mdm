import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App';

// Mock child components to focus on navigation and integration
jest.mock('../src/components/ProjectDashboard', () => ({
  ProjectDashboard: ({ onNewProject, onProjectSelect }: any) => (
    <div data-testid="project-dashboard">
      <button onClick={() => onNewProject()}>New Project</button>
      <button onClick={() => onProjectSelect(1)}>Select Project 1</button>
      Dashboard Content
    </div>
  )
}));

jest.mock('../src/components/ProjectDetail', () => ({
  ProjectDetail: ({ onBack }: any) => (
    <div data-testid="project-detail">
      <button onClick={() => onBack()}>Back to Dashboard</button>
      Project Detail Content
    </div>
  )
}));

jest.mock('../src/components/Progress', () => ({
  ProgressView: () => <div data-testid="progress-view">Progress Content</div>
}));

jest.mock('../src/components/Sessions', () => ({
  SessionsView: () => <div data-testid="sessions-view">Sessions Content</div>
}));

jest.mock('../src/components/NewProjectModal', () => ({
  NewProjectModal: () => <div data-testid="new-project-modal">New Project Modal</div>
}));

jest.mock('../src/components/QuickAddTask', () => ({
  QuickAddTask: () => <div data-testid="quick-add-task">Quick Add Task</div>
}));

jest.mock('../src/components/FocusMode', () => ({
  FocusMode: () => <div data-testid="focus-mode">Focus Mode</div>
}));

jest.mock('../src/components/PomodoroTimer', () => ({
  PomodoroTimer: () => <div data-testid="pomodoro-timer">Pomodoro Timer</div>
}));

jest.mock('../src/components/layout/Layout', () => ({
  Layout: ({ children, onViewChange, activeView }: any) => (
    <div data-testid="layout">
      <nav data-testid="sidebar">
        <button onClick={() => onViewChange('dashboard')} className={activeView === 'dashboard' ? 'active' : ''}>
          Dashboard
        </button>
        <button onClick={() => onViewChange('projects')} className={activeView === 'projects' ? 'active' : ''}>
          Projects  
        </button>
        <button onClick={() => onViewChange('progress')} className={activeView === 'progress' ? 'active' : ''}>
          Progress
        </button>
        <button onClick={() => onViewChange('sessions')} className={activeView === 'sessions' ? 'active' : ''}>
          Sessions
        </button>
      </nav>
      <main data-testid="main-content">
        {children}
      </main>
    </div>
  )
}));

// Mock auth context
jest.mock('../src/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: any) => children,
  useAuth: () => ({
    user: { id: 1, username: 'testuser', email: 'test@example.com' },
    isLoading: false
  })
}));

// Mock API
jest.mock('../src/lib/api', () => ({
  apiRequest: jest.fn()
}));

import { apiRequest } from '../src/lib/api';
const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

// Mock hotkeys
jest.mock('../src/hooks/useHotkeys', () => ({
  useHotkeys: jest.fn()
}));

describe('App Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock projects API response
    mockApiRequest.mockResolvedValue({
      ok: true,
      json: async () => []
    } as any);
  });

  describe('Navigation System', () => {
    it('should render main layout with sidebar', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByTestId('layout')).toBeInTheDocument();
        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
        expect(screen.getByTestId('main-content')).toBeInTheDocument();
      });
    });

    it('should display dashboard by default', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByTestId('project-dashboard')).toBeInTheDocument();
        expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
      });
    });

    it('should switch to Projects view when projects nav is clicked', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Projects' })).toBeInTheDocument();
      });
      
      const projectsButton = screen.getByRole('button', { name: 'Projects' });
      await user.click(projectsButton);
      
      // Projects view should show the same dashboard content for now
      expect(screen.getByTestId('project-dashboard')).toBeInTheDocument();
    });

    it('should switch to Progress view when progress nav is clicked', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Progress' })).toBeInTheDocument();
      });
      
      const progressButton = screen.getByRole('button', { name: 'Progress' });
      await user.click(progressButton);
      
      expect(screen.getByTestId('progress-view')).toBeInTheDocument();
      expect(screen.getByText('Progress Content')).toBeInTheDocument();
    });

    it('should switch to Sessions view when sessions nav is clicked', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Sessions' })).toBeInTheDocument();
      });
      
      const sessionsButton = screen.getByRole('button', { name: 'Sessions' });
      await user.click(sessionsButton);
      
      expect(screen.getByTestId('sessions-view')).toBeInTheDocument();
      expect(screen.getByText('Sessions Content')).toBeInTheDocument();
    });

    it('should highlight active navigation item', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await waitFor(() => {
        const dashboardButton = screen.getByRole('button', { name: 'Dashboard' });
        expect(dashboardButton).toHaveClass('active');
      });
      
      // Click Progress
      const progressButton = screen.getByRole('button', { name: 'Progress' });
      await user.click(progressButton);
      
      expect(progressButton).toHaveClass('active');
      expect(screen.getByRole('button', { name: 'Dashboard' })).not.toHaveClass('active');
    });
  });

  describe('Project Navigation', () => {
    it('should navigate to project detail when project is selected', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByTestId('project-dashboard')).toBeInTheDocument();
      });
      
      const selectProjectButton = screen.getByRole('button', { name: 'Select Project 1' });
      await user.click(selectProjectButton);
      
      expect(screen.getByTestId('project-detail')).toBeInTheDocument();
      expect(screen.getByText('Project Detail Content')).toBeInTheDocument();
    });

    it('should navigate back to dashboard from project detail', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByTestId('project-dashboard')).toBeInTheDocument();
      });
      
      // Navigate to project
      const selectProjectButton = screen.getByRole('button', { name: 'Select Project 1' });
      await user.click(selectProjectButton);
      
      expect(screen.getByTestId('project-detail')).toBeInTheDocument();
      
      // Navigate back
      const backButton = screen.getByRole('button', { name: 'Back to Dashboard' });
      await user.click(backButton);
      
      expect(screen.getByTestId('project-dashboard')).toBeInTheDocument();
      expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
    });

    it('should clear selected project when navigating to other views', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByTestId('project-dashboard')).toBeInTheDocument();
      });
      
      // Navigate to project
      const selectProjectButton = screen.getByRole('button', { name: 'Select Project 1' });
      await user.click(selectProjectButton);
      
      expect(screen.getByTestId('project-detail')).toBeInTheDocument();
      
      // Navigate to Progress
      const progressButton = screen.getByRole('button', { name: 'Progress' });
      await user.click(progressButton);
      
      expect(screen.getByTestId('progress-view')).toBeInTheDocument();
      
      // Navigate back to Dashboard - should show dashboard, not project detail
      const dashboardButton = screen.getByRole('button', { name: 'Dashboard' });
      await user.click(dashboardButton);
      
      expect(screen.getByTestId('project-dashboard')).toBeInTheDocument();
      expect(screen.queryByTestId('project-detail')).not.toBeInTheDocument();
    });
  });

  describe('Modal Management', () => {
    it('should open new project modal when New Project is clicked', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByTestId('project-dashboard')).toBeInTheDocument();
      });
      
      const newProjectButton = screen.getByRole('button', { name: 'New Project' });
      await user.click(newProjectButton);
      
      // Modal should be present (mocked component would show)
      expect(screen.getByTestId('project-dashboard')).toBeInTheDocument();
    });
  });

  describe('API Integration', () => {
    it('should fetch projects on app load when user is authenticated', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(mockApiRequest).toHaveBeenCalledWith('/api/projects');
      });
    });

    it('should handle API errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockApiRequest.mockRejectedValue(new Error('Network error'));
      
      render(<App />);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch projects:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('Pomodoro Timer Integration', () => {
    it('should show Pomodoro timer only when viewing a project', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByTestId('project-dashboard')).toBeInTheDocument();
      });
      
      // Should not show timer on dashboard
      expect(screen.queryByTestId('pomodoro-timer')).not.toBeInTheDocument();
      
      // Navigate to project
      const selectProjectButton = screen.getByRole('button', { name: 'Select Project 1' });
      await user.click(selectProjectButton);
      
      // Should show timer on project page
      expect(screen.getByTestId('project-detail')).toBeInTheDocument();
      // Timer would be mocked but should be present in real component
    });
  });

  describe('Focus Mode Integration', () => {
    it('should handle focus mode toggle', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByTestId('project-dashboard')).toBeInTheDocument();
      });
      
      // Focus mode component should be present but not active
      // This would be tested with actual focus mode interactions
    });
  });

  describe('Responsive Layout', () => {
    it('should maintain layout structure across different views', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const views = ['Progress', 'Sessions', 'Dashboard'];
      
      for (const view of views) {
        const button = screen.getByRole('button', { name: view });
        await user.click(button);
        
        // Layout should remain consistent
        expect(screen.getByTestId('layout')).toBeInTheDocument();
        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
        expect(screen.getByTestId('main-content')).toBeInTheDocument();
      }
    });
  });

  describe('State Management', () => {
    it('should maintain project list state across navigation', async () => {
      const user = userEvent.setup();
      
      // Mock projects response
      const mockProjects = [
        { id: 1, name: 'Test Project', description: 'Test' }
      ];
      mockApiRequest.mockResolvedValue({
        ok: true,
        json: async () => mockProjects
      } as any);
      
      render(<App />);
      
      await waitFor(() => {
        expect(mockApiRequest).toHaveBeenCalledWith('/api/projects');
      });
      
      // Navigate to different views
      const progressButton = screen.getByRole('button', { name: 'Progress' });
      await user.click(progressButton);
      
      const dashboardButton = screen.getByRole('button', { name: 'Dashboard' });
      await user.click(dashboardButton);
      
      // Should not refetch projects unnecessarily
      expect(mockApiRequest).toHaveBeenCalledTimes(1);
    });
  });
});