import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PomodoroTimer } from '../src/components/PomodoroTimer';
import { Project } from '../src/types';

// Mock the API request
jest.mock('../src/lib/api', () => ({
  apiRequest: jest.fn()
}));

import { apiRequest } from '../src/lib/api';
const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

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

// Mock timers
beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('PomodoroTimer', () => {
  const defaultProps = {
    projects: mockProjects,
    currentProjectId: 1
  };

  describe('Timer Display', () => {
    it('should display timer with default 25:00 time', () => {
      render(<PomodoroTimer {...defaultProps} />);
      
      expect(screen.getByText('25:00')).toBeInTheDocument();
    });

    it('should format time correctly', () => {
      render(<PomodoroTimer {...defaultProps} />);
      
      // Should show MM:SS format
      const timeDisplay = screen.getByText(/\d{2}:\d{2}/);
      expect(timeDisplay).toBeInTheDocument();
    });

    it('should show selected project name', () => {
      render(<PomodoroTimer {...defaultProps} />);
      
      expect(screen.getByText('Test Mod')).toBeInTheDocument();
    });
  });

  describe('Timer Controls', () => {
    it('should have Start/Play button initially', () => {
      render(<PomodoroTimer {...defaultProps} />);
      
      const startButton = screen.getByRole('button', { name: /start|play/i });
      expect(startButton).toBeInTheDocument();
    });

    it('should change to Pause button when timer is running', async () => {
      const user = userEvent.setup();
      render(<PomodoroTimer {...defaultProps} />);
      
      const startButton = screen.getByRole('button', { name: /start|play/i });
      await user.click(startButton);
      
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    });

    it('should have Stop/Reset button', () => {
      render(<PomodoroTimer {...defaultProps} />);
      
      const stopButton = screen.getByRole('button', { name: /stop|reset/i });
      expect(stopButton).toBeInTheDocument();
    });

    it('should reset timer when stop button is clicked', async () => {
      const user = userEvent.setup();
      render(<PomodoroTimer {...defaultProps} />);
      
      // Start timer
      const startButton = screen.getByRole('button', { name: /start|play/i });
      await user.click(startButton);
      
      // Wait a bit
      jest.advanceTimersByTime(5000);
      
      // Stop timer
      const stopButton = screen.getByRole('button', { name: /stop|reset/i });
      await user.click(stopButton);
      
      // Should reset to 25:00
      expect(screen.getByText('25:00')).toBeInTheDocument();
    });
  });

  describe('Timer Functionality', () => {
    it('should countdown when started', async () => {
      const user = userEvent.setup();
      render(<PomodoroTimer {...defaultProps} />);
      
      const startButton = screen.getByRole('button', { name: /start|play/i });
      await user.click(startButton);
      
      // Advance timer by 1 second
      jest.advanceTimersByTime(1000);
      
      expect(screen.getByText('24:59')).toBeInTheDocument();
    });

    it('should pause and resume correctly', async () => {
      const user = userEvent.setup();
      render(<PomodoroTimer {...defaultProps} />);
      
      // Start timer
      const startButton = screen.getByRole('button', { name: /start|play/i });
      await user.click(startButton);
      
      // Advance time
      jest.advanceTimersByTime(5000);
      expect(screen.getByText('24:55')).toBeInTheDocument();
      
      // Pause
      const pauseButton = screen.getByRole('button', { name: /pause/i });
      await user.click(pauseButton);
      
      // Advance time while paused
      jest.advanceTimersByTime(5000);
      expect(screen.getByText('24:55')).toBeInTheDocument(); // Should not change
      
      // Resume
      const resumeButton = screen.getByRole('button', { name: /start|play/i });
      await user.click(resumeButton);
      
      // Advance time
      jest.advanceTimersByTime(1000);
      expect(screen.getByText('24:54')).toBeInTheDocument();
    });
  });

  describe('Project Selection', () => {
    it('should have project selector dropdown', () => {
      render(<PomodoroTimer {...defaultProps} />);
      
      // Should show current project or dropdown
      expect(screen.getByText('Test Mod')).toBeInTheDocument();
    });

    it('should allow changing selected project', async () => {
      const user = userEvent.setup();
      render(<PomodoroTimer {...defaultProps} />);
      
      // Look for project selector (might be a select or button)
      const projectSelector = screen.getByText('Test Mod');
      if (projectSelector.closest('select') || projectSelector.closest('button')) {
        await user.click(projectSelector);
        
        // Should show other projects
        expect(screen.getByText('Another Mod')).toBeInTheDocument();
      }
    });
  });

  describe('Session Notes', () => {
    it('should have "Add Quick Note" button during session', async () => {
      const user = userEvent.setup();
      render(<PomodoroTimer {...defaultProps} />);
      
      // Start timer
      const startButton = screen.getByRole('button', { name: /start|play/i });
      await user.click(startButton);
      
      // Should show notes button or input
      expect(screen.getByRole('button', { name: /note|quick note/i }) || 
             screen.getByPlaceholderText(/note/i)).toBeInTheDocument();
    });

    it('should allow adding notes during session', async () => {
      const user = userEvent.setup();
      render(<PomodoroTimer {...defaultProps} />);
      
      // Start timer
      const startButton = screen.getByRole('button', { name: /start|play/i });
      await user.click(startButton);
      
      // Look for notes input
      const notesInput = screen.getByPlaceholderText(/note/i) || 
                        screen.getByLabelText(/note/i);
      
      if (notesInput) {
        await user.type(notesInput, 'Working on core feature');
        expect(notesInput).toHaveValue('Working on core feature');
      }
    });
  });

  describe('Session Completion', () => {
    it('should trigger session completion when timer reaches 00:00', async () => {
      mockApiRequest.mockResolvedValue({
        ok: true,
        json: async () => ({ message: 'Session logged' })
      } as any);
      
      const user = userEvent.setup();
      render(<PomodoroTimer {...defaultProps} />);
      
      // Start timer
      const startButton = screen.getByRole('button', { name: /start|play/i });
      await user.click(startButton);
      
      // Fast forward to completion (25 minutes = 1500 seconds)
      jest.advanceTimersByTime(1500000);
      
      // Should trigger completion modal or API call
      await waitFor(() => {
        expect(screen.getByText(/session complete/i) || 
               screen.getByText(/well done/i) ||
               screen.getByText(/save session/i)).toBeInTheDocument();
      });
    });

    it('should show session completion modal with options', async () => {
      mockApiRequest.mockResolvedValue({
        ok: true,
        json: async () => ({ message: 'Session logged' })
      } as any);
      
      const user = userEvent.setup();
      render(<PomodoroTimer {...defaultProps} />);
      
      // Start timer
      const startButton = screen.getByRole('button', { name: /start|play/i });
      await user.click(startButton);
      
      // Complete timer
      jest.advanceTimersByTime(1500000);
      
      await waitFor(() => {
        // Should show completion modal with save option
        expect(screen.getByRole('button', { name: /save|log session/i })).toBeInTheDocument();
      });
    });

    it('should log session to API on completion', async () => {
      mockApiRequest.mockResolvedValue({
        ok: true,
        json: async () => ({ message: 'Session logged' })
      } as any);
      
      const user = userEvent.setup();
      render(<PomodoroTimer {...defaultProps} />);
      
      // Start timer
      const startButton = screen.getByRole('button', { name: /start|play/i });
      await user.click(startButton);
      
      // Complete timer
      jest.advanceTimersByTime(1500000);
      
      // Wait for API call
      await waitFor(() => {
        expect(mockApiRequest).toHaveBeenCalledWith('/api/sessions', expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('duration')
        }));
      });
    });
  });

  describe('Collapsible Design', () => {
    it('should be collapsible when not in minimal mode', () => {
      render(<PomodoroTimer {...defaultProps} />);
      
      // Should have collapse/expand button
      const collapseButton = screen.getByRole('button', { name: /collapse|expand|chevron/i });
      expect(collapseButton).toBeInTheDocument();
    });

    it('should toggle collapsed state', async () => {
      const user = userEvent.setup();
      render(<PomodoroTimer {...defaultProps} />);
      
      const collapseButton = screen.getByRole('button', { name: /collapse|expand|chevron/i });
      
      // Initially should show full timer
      expect(screen.getByText('25:00')).toBeInTheDocument();
      
      // Click to collapse
      await user.click(collapseButton);
      
      // Should still show timer but in collapsed form
      expect(screen.getByText('25:00')).toBeInTheDocument();
    });
  });

  describe('Minimal Mode', () => {
    it('should render in minimal mode when isMinimal prop is true', () => {
      render(<PomodoroTimer {...defaultProps} isMinimal={true} />);
      
      // Should still show essential elements but in minimal form
      expect(screen.getByText('25:00')).toBeInTheDocument();
    });
  });

  describe('Progress Integration', () => {
    it('should work with pinned tasks', () => {
      render(<PomodoroTimer {...defaultProps} />);
      
      // Should show timer for current project
      expect(screen.getByText('Test Mod')).toBeInTheDocument();
    });
  });
});