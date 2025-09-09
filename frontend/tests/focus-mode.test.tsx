import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PomodoroTimer } from '../src/components/PomodoroTimer';
import * as api from '../src/lib/api';

// Mock the API
jest.mock('../src/lib/api');
const mockApiRequest = api.apiRequest as jest.MockedFunction<typeof api.apiRequest>;

const mockProjects = [
  {
    id: 1,
    name: 'Test Project',
    description: 'Test project description',
    status: 'active',
    color: '#3b82f6'
  }
];

describe('Focus Mode Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiRequest.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    } as Response);
  });

  test('should show Focus Mode button in Pomodoro timer', async () => {
    render(<PomodoroTimer projects={mockProjects} currentProjectId={1} />);

    // Should show Focus Mode button
    const focusModeButton = screen.getByRole('button', { name: /focus mode/i });
    expect(focusModeButton).toBeInTheDocument();
  });

  test('should activate Focus Mode overlay when clicked', async () => {
    render(<PomodoroTimer projects={mockProjects} currentProjectId={1} />);

    // Click Focus Mode button
    const focusModeButton = screen.getByRole('button', { name: /focus mode/i });
    fireEvent.click(focusModeButton);

    // Should show focus mode overlay
    await waitFor(() => {
      expect(screen.getByText(/current focus/i)).toBeInTheDocument();
    });

    // Should show motivational quote
    expect(screen.getByText(/🎯/)).toBeInTheDocument();
  });

  test('should show random quotes including outlandish ones', async () => {
    render(<PomodoroTimer projects={mockProjects} currentProjectId={1} />);

    // Activate focus mode multiple times to test different quotes
    const focusModeButton = screen.getByRole('button', { name: /focus mode/i });
    
    const quotes = [];
    for (let i = 0; i < 10; i++) {
      fireEvent.click(focusModeButton);
      
      await waitFor(() => {
        const quoteElements = screen.getAllByText(/"/);
        if (quoteElements.length > 0) {
          const quoteText = quoteElements[0].closest('blockquote')?.textContent;
          if (quoteText && !quotes.includes(quoteText)) {
            quotes.push(quoteText);
          }
        }
      });

      // Exit focus mode
      const exitButton = screen.getByRole('button', { name: /exit focus mode/i });
      fireEvent.click(exitButton);
    }

    // Should have collected some quotes
    expect(quotes.length).toBeGreaterThan(0);
  });

  test('should show timer with progress bar in focus mode', async () => {
    render(<PomodoroTimer projects={mockProjects} currentProjectId={1} />);

    // Click Focus Mode button
    const focusModeButton = screen.getByRole('button', { name: /focus mode/i });
    fireEvent.click(focusModeButton);

    await waitFor(() => {
      // Should show timer
      expect(screen.getByText(/25:00|24:59/)).toBeInTheDocument();
      
      // Should show project info
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });
  });

  test('should exit focus mode properly', async () => {
    render(<PomodoroTimer projects={mockProjects} currentProjectId={1} />);

    // Activate focus mode
    const focusModeButton = screen.getByRole('button', { name: /focus mode/i });
    fireEvent.click(focusModeButton);

    await waitFor(() => {
      expect(screen.getByText(/current focus/i)).toBeInTheDocument();
    });

    // Exit focus mode
    const exitButton = screen.getByRole('button', { name: /exit focus mode/i });
    fireEvent.click(exitButton);

    // Should hide focus mode overlay
    await waitFor(() => {
      expect(screen.queryByText(/current focus/i)).not.toBeInTheDocument();
    });
  });

  test('should have white color scheme in focus mode', async () => {
    render(<PomodoroTimer projects={mockProjects} currentProjectId={1} />);

    // Activate focus mode
    const focusModeButton = screen.getByRole('button', { name: /focus mode/i });
    fireEvent.click(focusModeButton);

    await waitFor(() => {
      const overlay = document.querySelector('.fixed.inset-0');
      expect(overlay).toHaveClass('bg-white');
    });
  });

  test('should show focus mode below timer widget (z-index test)', async () => {
    render(<PomodoroTimer projects={mockProjects} currentProjectId={1} />);

    // Activate focus mode
    const focusModeButton = screen.getByRole('button', { name: /focus mode/i });
    fireEvent.click(focusModeButton);

    await waitFor(() => {
      const overlay = document.querySelector('.fixed.inset-0');
      const styles = window.getComputedStyle(overlay as Element);
      expect(parseInt(styles.zIndex)).toBeLessThan(50); // Should be below timer (z-50)
    });
  });
});