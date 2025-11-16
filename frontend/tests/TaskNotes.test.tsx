import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { TaskNotes } from '../src/components/TaskNotes';
import { apiRequest } from '../src/lib/api';

// Mock the API
jest.mock('../src/lib/api');
const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

// Mock the NoteContent component for tests
jest.mock('../src/components/NoteContent', () => ({
  NoteContent: ({ content }: { content: string }) => (
    <div data-testid="note-content">{content}</div>
  ),
}));

const mockNotes = [
  {
    id: 1,
    task_id: 1,
    content: 'First note',
    created_at: '2023-01-01T00:00:00Z',
    order_index: 0,
  },
  {
    id: 2,
    task_id: 1,
    content: 'Second note',
    created_at: '2023-01-02T00:00:00Z',
    order_index: 1,
  },
  {
    id: 3,
    task_id: 1,
    content: 'Third note',
    created_at: '2023-01-03T00:00:00Z',
    order_index: 2,
  },
];

describe('TaskNotes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render notes correctly', async () => {
    mockApiRequest.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockNotes),
    } as Response);

    await act(async () => {
      render(<TaskNotes taskId={1} />);
    });

    await waitFor(() => {
      expect(screen.getByText('First note')).toBeInTheDocument();
      expect(screen.getByText('Second note')).toBeInTheDocument();
      expect(screen.getByText('Third note')).toBeInTheDocument();
    });
  });

  it('should handle drag start event', async () => {
    mockApiRequest.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockNotes),
    } as Response);

    await act(async () => {
      render(<TaskNotes taskId={1} />);
    });

    await waitFor(() => {
      expect(screen.getByText('First note')).toBeInTheDocument();
    });

    const firstNote = screen.getByText('First note').closest('[draggable="true"]');
    expect(firstNote).toBeInTheDocument();

    fireEvent.dragStart(firstNote!, {
      dataTransfer: {
        effectAllowed: 'move',
        setData: jest.fn(),
      },
    });

    // Verify the note gets the dragging class
    expect(firstNote).toHaveClass('opacity-50');
  });

  it('should show drag over indicators', async () => {
    mockApiRequest.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockNotes),
    } as Response);

    await act(async () => {
      render(<TaskNotes taskId={1} />);
    });

    await waitFor(() => {
      expect(screen.getByText('Second note')).toBeInTheDocument();
    });

    const firstNote = screen.getByText('First note').closest('[draggable="true"]');
    const secondNote = screen.getByText('Second note').closest('[draggable="true"]');

    // Start dragging first note
    fireEvent.dragStart(firstNote!, {
      dataTransfer: {
        effectAllowed: 'move',
        setData: jest.fn(),
      },
    });

    // Drag over second note
    fireEvent.dragOver(secondNote!, {
      dataTransfer: {
        dropEffect: 'move',
      },
      clientY: 75, // Above middle
    });

    // Should show visual feedback
    expect(secondNote).toHaveClass('ring-2', 'ring-blue-300');
  });

  it('should handle drop event and reorder notes', async () => {
    mockApiRequest
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockNotes),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);

    await act(async () => {
      render(<TaskNotes taskId={1} />);
    });

    await waitFor(() => {
      expect(screen.getByText('First note')).toBeInTheDocument();
    });

    const firstNote = screen.getByText('First note').closest('[draggable="true"]');
    const thirdNote = screen.getByText('Third note').closest('[draggable="true"]');

    // Start dragging first note
    fireEvent.dragStart(firstNote!, {
      dataTransfer: {
        effectAllowed: 'move',
        setData: jest.fn(),
      },
    });

    // Drag over third note
    fireEvent.dragOver(thirdNote!, {
      dataTransfer: {
        dropEffect: 'move',
      },
      clientY: 125, // Below middle
    });

    // Drop on third note
    await act(async () => {
      fireEvent.drop(thirdNote!, {
        dataTransfer: {
          getData: jest.fn(),
        },
      });
    });

    // Should call reorder API
    await waitFor(() => {
      expect(mockApiRequest).toHaveBeenCalledWith('/api/task-notes/reorder', {
        method: 'PUT',
        body: JSON.stringify({
          task_id: 1,
          note_ids: [2, 3, 1], // Expected new order after moving first note to after third
        }),
      });
    });
  });

  it('should handle adding new notes', async () => {
    mockApiRequest
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockNotes),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 4 }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          ...mockNotes,
          {
            id: 4,
            task_id: 1,
            content: 'New note',
            created_at: '2023-01-04T00:00:00Z',
            order_index: 3,
          },
        ]),
      } as Response);

    await act(async () => {
      render(<TaskNotes taskId={1} />);
    });

    await waitFor(() => {
      expect(screen.getByText('Add Note')).toBeInTheDocument();
    });

    // Click add note button
    const addButton = screen.getByText('Add Note');
    fireEvent.click(addButton);

    // Should show inline form
    const textarea = screen.getByPlaceholderText('Enter your note...');
    expect(textarea).toBeInTheDocument();

    // Enter note content
    fireEvent.change(textarea, { target: { value: 'New note' } });

    // Click save button
    const saveButton = screen.getByText('Save Note');
    await act(async () => {
      fireEvent.click(saveButton);
    });

    // Should call API to add note
    await waitFor(() => {
      expect(mockApiRequest).toHaveBeenCalledWith('/api/task-notes', {
        method: 'POST',
        body: JSON.stringify({
          task_id: 1,
          content: 'New note',
        }),
      });
    });
  });

  it('should handle drag end event', async () => {
    mockApiRequest.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockNotes),
    } as Response);

    await act(async () => {
      render(<TaskNotes taskId={1} />);
    });

    await waitFor(() => {
      expect(screen.getByText('First note')).toBeInTheDocument();
    });

    const firstNote = screen.getByText('First note').closest('[draggable="true"]');

    // Start dragging
    fireEvent.dragStart(firstNote!, {
      dataTransfer: {
        effectAllowed: 'move',
        setData: jest.fn(),
      },
    });

    // Verify dragging state
    expect(firstNote).toHaveClass('opacity-50');

    // End dragging
    fireEvent.dragEnd(firstNote!);

    // Should not have drag visual indicators after drag end
    expect(firstNote).not.toHaveClass('opacity-50');
  });

  it('should prevent dropping on same note', async () => {
    mockApiRequest.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockNotes),
    } as Response);

    await act(async () => {
      render(<TaskNotes taskId={1} />);
    });

    await waitFor(() => {
      expect(screen.getByText('First note')).toBeInTheDocument();
    });

    const firstNote = screen.getByText('First note').closest('[draggable="true"]');

    // Start dragging first note
    fireEvent.dragStart(firstNote!, {
      dataTransfer: {
        effectAllowed: 'move',
        setData: jest.fn(),
      },
    });

    // Try to drop on same note
    await act(async () => {
      fireEvent.drop(firstNote!, {
        dataTransfer: {
          getData: jest.fn(),
        },
      });
    });

    // Should not call reorder API
    expect(mockApiRequest).toHaveBeenCalledTimes(1); // Only the initial fetch
  });

  it('should show blue insert position indicators during drag', async () => {
    mockApiRequest.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockNotes),
    } as Response);

    await act(async () => {
      render(<TaskNotes taskId={1} />);
    });

    await waitFor(() => {
      expect(screen.getByText('First note')).toBeInTheDocument();
    });

    const firstNote = screen.getByText('First note').closest('[draggable="true"]');
    const secondNote = screen.getByText('Second note').closest('[draggable="true"]');

    // Start dragging first note
    fireEvent.dragStart(firstNote!);

    // Drag over second note (above middle - should show "before" indicator)
    fireEvent.dragOver(secondNote!, {
      clientY: 50, // Above middle (assuming rect is 50-150)
    });

    // Should show blue highlight on target
    expect(secondNote).toHaveClass('ring-2', 'ring-blue-300');
  });

  it('should render notes using NoteContent component', async () => {
    mockApiRequest.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockNotes),
    } as Response);

    await act(async () => {
      render(<TaskNotes taskId={1} />);
    });

    await waitFor(() => {
      // Verify that notes are rendered (with mocked NoteContent)
      const noteContents = screen.getAllByTestId('note-content');
      expect(noteContents).toHaveLength(3);
      expect(noteContents[0]).toHaveTextContent('First note');
      expect(noteContents[1]).toHaveTextContent('Second note');
      expect(noteContents[2]).toHaveTextContent('Third note');
    });
  });

  it('should support inline editing of notes when clicking edit button', async () => {
    mockApiRequest
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockNotes),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          {
            id: 1,
            task_id: 1,
            content: 'Updated first note',
            created_at: '2023-01-01T00:00:00Z',
            order_index: 0,
          },
          mockNotes[1],
          mockNotes[2],
        ]),
      } as Response);

    const { container } = render(<TaskNotes taskId={1} />);

    await waitFor(() => {
      const noteContents = screen.getAllByTestId('note-content');
      expect(noteContents).toHaveLength(3);
    });

    // Find the Edit button for the first note - there's an Edit icon button
    const cards = container.querySelectorAll('.rounded-lg.border');
    expect(cards.length).toBe(3);
    
    // Get the first note card
    const firstCard = cards[0];
    
    // Find the edit button (has lucide-pen-square icon)
    const editButtons = firstCard.querySelectorAll('button');
    const editButton = Array.from(editButtons).find(btn => 
      btn.querySelector('.lucide-pen-square')
    );
    expect(editButton).toBeTruthy();
    
    await act(async () => {
      fireEvent.click(editButton!);
    });

    // After clicking edit, the note card should have cursor-text class and not be draggable
    await waitFor(() => {
      const card = firstCard;
      expect(card.classList.contains('cursor-text')).toBe(true);
      expect(card.getAttribute('draggable')).toBe('false');
    });

    // The edit buttons should be hidden when in edit mode
    await waitFor(() => {
      const buttonsContainer = firstCard.querySelector('.flex.space-x-1.flex-shrink-0');
      expect(buttonsContainer).not.toBeInTheDocument();
    });
  });
});