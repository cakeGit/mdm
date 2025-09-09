import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProgressView } from '../src/components/Progress';
import { TaskNotes } from '../src/components/TaskNotes';
import * as api from '../src/lib/api';

// Mock the API
jest.mock('../src/lib/api');
const mockApiRequest = api.apiRequest as jest.MockedFunction<typeof api.apiRequest>;

const mockProgressData = {
  totalProjects: 5,
  activeProjects: 3,
  completedTasks: 15,
  totalTasks: 25,
  totalSessionTime: 7200,
  streak: 7,
  weeklyStats: {
    thisWeek: { tasks: 8, sessions: 12, time: 3600 },
    lastWeek: { tasks: 6, sessions: 10, time: 3000 }
  }
};

const mockTaskNotes = [
  {
    id: 1,
    task_id: 1,
    content: 'First note content',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    task_id: 1,
    content: 'Second note content',
    created_at: '2024-01-01T01:00:00Z'
  }
];

describe('Data Display and UI Improvements', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ProgressView Component Task Count Display', () => {
    test('should display actual task counts in progress cards', async () => {
      mockApiRequest.mockResolvedValue({
        ok: true,
        json: async () => mockProgressData
      } as Response);

      render(<ProgressView />);

      await waitFor(() => {
        // Should show completed vs total tasks
        expect(screen.getByText('15 of 25 tasks')).toBeInTheDocument();
        
        // Should show percentage
        expect(screen.getByText('60%')).toBeInTheDocument();
        
        // Should show this week's task count
        expect(screen.getByText('8')).toBeInTheDocument();
      });
    });

    test('should show progress bars with borders for better readability', async () => {
      mockApiRequest.mockResolvedValue({
        ok: true,
        json: async () => mockProgressData
      } as Response);

      render(<ProgressView />);

      await waitFor(() => {
        const progressBars = document.querySelectorAll('[data-testid="progress-bar"], .progress');
        progressBars.forEach(bar => {
          expect(bar).toHaveClass('border');
        });
      });
    });

    test('should display Progress Streak instead of Momentum Meter', async () => {
      mockApiRequest.mockResolvedValue({
        ok: true,
        json: async () => mockProgressData
      } as Response);

      render(<ProgressView />);

      await waitFor(() => {
        expect(screen.getByText('Progress Streak')).toBeInTheDocument();
        expect(screen.queryByText('Momentum Meter')).not.toBeInTheDocument();
      });
    });

    test('should show streak count and message', async () => {
      mockApiRequest.mockResolvedValue({
        ok: true,
        json: async () => mockProgressData
      } as Response);

      render(<ProgressView />);

      await waitFor(() => {
        expect(screen.getByText('7')).toBeInTheDocument();
        expect(screen.getByText('days streak')).toBeInTheDocument();
        expect(screen.getByText('You\'re on fire!')).toBeInTheDocument();
      });
    });
  });

  describe('Task Notes Features', () => {
    test('should render notes with white backgrounds', async () => {
      mockApiRequest.mockResolvedValue({
        ok: true,
        json: async () => mockTaskNotes
      } as Response);

      render(<TaskNotes taskId={1} />);

      await waitFor(() => {
        const noteCards = document.querySelectorAll('.bg-white');
        expect(noteCards.length).toBeGreaterThan(0);
      });
    });

    test('should make notes draggable', async () => {
      mockApiRequest.mockResolvedValue({
        ok: true,
        json: async () => mockTaskNotes
      } as Response);

      render(<TaskNotes taskId={1} />);

      await waitFor(() => {
        const firstNote = screen.getByText('First note content').closest('[draggable]');
        expect(firstNote).toHaveAttribute('draggable', 'true');
        expect(firstNote).toHaveClass('cursor-move');
      });
    });

    test('should handle drag and drop reordering', async () => {
      mockApiRequest.mockResolvedValue({
        ok: true,
        json: async () => mockTaskNotes
      } as Response);

      render(<TaskNotes taskId={1} />);

      await waitFor(() => {
        const firstNote = screen.getByText('First note content').closest('[draggable]') as HTMLElement;
        const secondNote = screen.getByText('Second note content').closest('[draggable]') as HTMLElement;

        // Simulate drag start
        fireEvent.dragStart(firstNote, {
          dataTransfer: { setData: jest.fn() }
        });

        // Simulate drop
        fireEvent.drop(secondNote);

        // Should call API to reorder
        expect(mockApiRequest).toHaveBeenCalledWith(
          expect.stringContaining('/api/task-notes'),
          expect.objectContaining({
            method: 'PATCH'
          })
        );
      });
    });

    test('should show inline add form instead of modal', async () => {
      mockApiRequest.mockResolvedValue({
        ok: true,
        json: async () => mockTaskNotes
      } as Response);

      render(<TaskNotes taskId={1} />);

      await waitFor(() => {
        const addButton = screen.getByRole('button', { name: /add note/i });
        fireEvent.click(addButton);

        // Should show inline form, not modal
        expect(screen.getByPlaceholderText(/enter your note/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates', () => {
    test('should refresh data when tasks are completed', async () => {
      mockApiRequest.mockResolvedValue({
        ok: true,
        json: async () => mockProgressData
      } as Response);

      const { rerender } = render(<ProgressView />);

      // Initial render
      await waitFor(() => {
        expect(screen.getByText('15 of 25 tasks')).toBeInTheDocument();
      });

      // Update mock data
      const updatedData = { ...mockProgressData, completedTasks: 16 };
      mockApiRequest.mockResolvedValue({
        ok: true,
        json: async () => updatedData
      } as Response);

      // Rerender to simulate update
      rerender(<ProgressView />);

      await waitFor(() => {
        expect(screen.getByText('16 of 25 tasks')).toBeInTheDocument();
      });
    });
  });
});