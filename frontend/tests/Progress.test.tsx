import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProgressView } from '../src/components/Progress';

// Mock the API request
jest.mock('../src/lib/api', () => ({
  apiRequest: jest.fn()
}));

import { apiRequest } from '../src/lib/api';
const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

const mockProgressData = {
  totalProjects: 5,
  activeProjects: 3,
  completedTasks: 25,
  totalTasks: 50,
  totalSessionTime: 14400, // 4 hours in seconds
  streak: 7,
  weeklyStats: {
    thisWeek: { tasks: 8, sessions: 12, time: 7200 },
    lastWeek: { tasks: 6, sessions: 10, time: 6000 }
  }
};

describe('ProgressView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful API response
    mockApiRequest.mockResolvedValue({
      ok: true,
      json: async () => mockProgressData
    } as any);
  });

  describe('Progress Data Display', () => {
    it('should display total project statistics', async () => {
      render(<ProgressView />);
      
      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument(); // totalProjects
        expect(screen.getByText('3')).toBeInTheDocument(); // activeProjects
      });
    });

    it('should show task completion statistics', async () => {
      render(<ProgressView />);
      
      await waitFor(() => {
        expect(screen.getByText('25')).toBeInTheDocument(); // completedTasks
        expect(screen.getByText('50')).toBeInTheDocument(); // totalTasks
        // Should show completion ratio
        expect(screen.getByText(/25.*50/)).toBeInTheDocument();
      });
    });

    it('should display formatted session time', async () => {
      render(<ProgressView />);
      
      await waitFor(() => {
        // 14400 seconds = 4h 0m
        expect(screen.getByText(/4h.*0m/)).toBeInTheDocument();
      });
    });

    it('should show current streak', async () => {
      render(<ProgressView />);
      
      await waitFor(() => {
        expect(screen.getByText('7')).toBeInTheDocument(); // streak
        expect(screen.getByText(/streak/i)).toBeInTheDocument();
      });
    });
  });

  describe('Weekly Progress Metrics', () => {
    it('should display this week\'s statistics', async () => {
      render(<ProgressView />);
      
      await waitFor(() => {
        expect(screen.getByText('8')).toBeInTheDocument(); // thisWeek.tasks
        expect(screen.getByText('12')).toBeInTheDocument(); // thisWeek.sessions
        // thisWeek.time = 7200 seconds = 2h 0m
        expect(screen.getByText(/2h.*0m/)).toBeInTheDocument();
      });
    });

    it('should display last week\'s statistics for comparison', async () => {
      render(<ProgressView />);
      
      await waitFor(() => {
        expect(screen.getByText('6')).toBeInTheDocument(); // lastWeek.tasks
        expect(screen.getByText('10')).toBeInTheDocument(); // lastWeek.sessions
        // lastWeek.time = 6000 seconds = 1h 40m
        expect(screen.getByText(/1h.*40m/)).toBeInTheDocument();
      });
    });

    it('should show weekly comparison indicators', async () => {
      render(<ProgressView />);
      
      await waitFor(() => {
        // Should show improvement indicators (this week > last week)
        // Tasks: 8 > 6, Sessions: 12 > 10, Time: 7200 > 6000
        expect(screen.getByText(/this week/i)).toBeInTheDocument();
        expect(screen.getByText(/last week/i)).toBeInTheDocument();
      });
    });
  });

  describe('Momentum Meter Integration', () => {
    it('should display MomentumMeter component', async () => {
      render(<ProgressView />);
      
      await waitFor(() => {
        // MomentumMeter should be included
        expect(screen.getByText(/momentum|streak/i)).toBeInTheDocument();
      });
    });
  });

  describe('Activity Calendar', () => {
    it('should display ActivityCalendar component', async () => {
      render(<ProgressView />);
      
      await waitFor(() => {
        // ActivityCalendar should be included
        expect(screen.getByText(/activity|calendar/i)).toBeInTheDocument();
      });
    });

    it('should show session activity visualization', async () => {
      render(<ProgressView />);
      
      await waitFor(() => {
        // Should show calendar-like visualization
        // Look for month/calendar indicators
        expect(screen.getByText(/jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i) ||
               screen.getByText(/monday|tuesday|wednesday|thursday|friday|saturday|sunday/i) ||
               screen.getByText(/\d{1,2}/)).toBeInTheDocument();
      });
    });
  });

  describe('Progress Overview', () => {
    it('should show overall progress visualization', async () => {
      render(<ProgressView />);
      
      await waitFor(() => {
        // Should have progress bars or charts
        const progressBars = screen.getAllByRole('progressbar');
        expect(progressBars.length).toBeGreaterThan(0);
      });
    });

    it('should display project completion percentages', async () => {
      render(<ProgressView />);
      
      await waitFor(() => {
        // Should calculate and show completion percentages
        // 25/50 = 50%
        expect(screen.getByText(/50%|50/) || screen.getByText(/0\.5/)).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state initially', () => {
      // Mock slow API response
      mockApiRequest.mockImplementation(() => new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: async () => mockProgressData
        } as any), 1000)
      ));
      
      render(<ProgressView />);
      
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should hide loading state after data loads', async () => {
      render(<ProgressView />);
      
      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('should fetch progress data on mount', async () => {
      render(<ProgressView />);
      
      await waitFor(() => {
        expect(mockApiRequest).toHaveBeenCalledWith('/api/stats/progress');
      });
    });

    it('should handle API errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockApiRequest.mockRejectedValue(new Error('API Error'));
      
      render(<ProgressView />);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch progress data:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });

    it('should show error state when API fails', async () => {
      mockApiRequest.mockRejectedValue(new Error('API Error'));
      
      render(<ProgressView />);
      
      await waitFor(() => {
        // Should show some indication of error or empty state
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Time Formatting', () => {
    it('should format seconds correctly into hours and minutes', async () => {
      render(<ProgressView />);
      
      await waitFor(() => {
        // Test different time formats
        // 14400 seconds = 4h 0m
        expect(screen.getByText(/4h.*0m/)).toBeInTheDocument();
        // 7200 seconds = 2h 0m  
        expect(screen.getByText(/2h.*0m/)).toBeInTheDocument();
        // 6000 seconds = 1h 40m
        expect(screen.getByText(/1h.*40m/)).toBeInTheDocument();
      });
    });

    it('should handle edge cases for time formatting', async () => {
      const edgeData = {
        ...mockProgressData,
        totalSessionTime: 3661, // 1h 1m 1s -> should show as 1h 1m
        weeklyStats: {
          thisWeek: { tasks: 1, sessions: 1, time: 60 }, // 1 minute
          lastWeek: { tasks: 0, sessions: 0, time: 0 }
        }
      };
      
      mockApiRequest.mockResolvedValue({
        ok: true,
        json: async () => edgeData
      } as any);
      
      render(<ProgressView />);
      
      await waitFor(() => {
        expect(screen.getByText(/1h.*1m/)).toBeInTheDocument();
        expect(screen.getByText(/0h.*1m/)).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should render properly on different screen sizes', async () => {
      render(<ProgressView />);
      
      await waitFor(() => {
        // Should have responsive layout with cards or grid
        const cards = screen.getAllByRole('region') || 
                     screen.getAllByText(/progress|statistics|activity/i);
        expect(cards.length).toBeGreaterThan(0);
      });
    });
  });
});