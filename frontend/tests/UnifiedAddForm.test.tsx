import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UnifiedAddForm, FieldConfig } from '@/components/UnifiedAddForm';

describe('UnifiedAddForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Stage Form Configuration', () => {
    const stageFields: FieldConfig[] = [
      {
        key: 'name',
        label: 'Stage Name',
        placeholder: 'Enter stage name...',
        type: 'input',
        required: true
      },
      {
        key: 'description',
        label: 'Stage Description',
        placeholder: 'Enter stage description (optional)...',
        type: 'input',
        required: false
      }
    ];

    test('renders stage form with correct fields and styling', () => {
      render(
        <UnifiedAddForm
          fields={stageFields}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          submitLabel="Save Stage"
        />
      );

      expect(screen.getByPlaceholderText('Enter stage name...')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter stage description (optional)...')).toBeInTheDocument();
      expect(screen.getByText('Save Stage')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();

      // Check grey color scheme
      const form = document.querySelector('.border-dashed');
      expect(form).toHaveClass('border-gray-300');
      expect(form).toHaveClass('bg-gray-50');
    });

    test('submits stage form with Enter key', async () => {
      render(
        <UnifiedAddForm
          fields={stageFields}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          submitLabel="Save Stage"
        />
      );

      const nameInput = screen.getByPlaceholderText('Enter stage name...');
      fireEvent.change(nameInput, { target: { value: 'Test Stage' } });
      fireEvent.keyDown(nameInput, { key: 'Enter' });

      expect(mockOnSubmit).toHaveBeenCalledWith(
        { name: 'Test Stage', description: '' },
        false
      );
    });
  });

  describe('Task Form Configuration', () => {
    const taskFields: FieldConfig[] = [
      {
        key: 'title',
        label: 'Task Title',
        placeholder: 'Enter task title...',
        type: 'input',
        required: true
      },
      {
        key: 'description',
        label: 'Task Description',
        placeholder: 'Enter task description (optional)...',
        type: 'input',
        required: false
      }
    ];

    test('renders task form with correct fields', () => {
      render(
        <UnifiedAddForm
          fields={taskFields}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          submitLabel="Save Task"
        />
      );

      expect(screen.getByPlaceholderText('Enter task title...')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter task description (optional)...')).toBeInTheDocument();
      expect(screen.getByText('Save Task')).toBeInTheDocument();
    });

    test('submits task form with Shift+Enter for keep open', async () => {
      render(
        <UnifiedAddForm
          fields={taskFields}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          submitLabel="Save Task"
        />
      );

      const titleInput = screen.getByPlaceholderText('Enter task title...');
      fireEvent.change(titleInput, { target: { value: 'Test Task' } });
      fireEvent.keyDown(titleInput, { key: 'Enter', shiftKey: true });

      expect(mockOnSubmit).toHaveBeenCalledWith(
        { title: 'Test Task', description: '' },
        true
      );
    });
  });

  describe('Note Form Configuration', () => {
    const noteFields: FieldConfig[] = [
      {
        key: 'content',
        label: 'Note Content',
        placeholder: 'Enter your note...',
        type: 'textarea',
        required: true,
        allowNewlines: true
      }
    ];

    test('renders note form with textarea', () => {
      render(
        <UnifiedAddForm
          fields={noteFields}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          submitLabel="Save Note"
        />
      );

      expect(screen.getByPlaceholderText('Enter your note...')).toBeInTheDocument();
      expect(screen.getByText('Save Note')).toBeInTheDocument();

      // Should render textarea, not input
      const textarea = screen.getByPlaceholderText('Enter your note...');
      expect(textarea.tagName).toBe('TEXTAREA');
    });

    test('allows newlines with Shift+Enter in note content', async () => {
      render(
        <UnifiedAddForm
          fields={noteFields}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          submitLabel="Save Note"
        />
      );

      const textarea = screen.getByPlaceholderText('Enter your note...');
      fireEvent.change(textarea, { target: { value: 'Line 1' } });
      
      // Shift+Enter should not submit (allow newline)
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });
      expect(mockOnSubmit).not.toHaveBeenCalled();

      // Regular Enter should submit
      fireEvent.keyDown(textarea, { key: 'Enter' });
      expect(mockOnSubmit).toHaveBeenCalledWith(
        { content: 'Line 1' },
        false
      );
    });
  });

  describe('General Functionality', () => {
    const simpleFields: FieldConfig[] = [
      {
        key: 'test',
        label: 'Test Field',
        placeholder: 'Enter test...',
        type: 'input',
        required: true
      }
    ];

    test('disables submit button when required fields are empty', () => {
      render(
        <UnifiedAddForm
          fields={simpleFields}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          submitLabel="Save"
        />
      );

      const submitButton = screen.getByText('Save');
      expect(submitButton).toBeDisabled();
    });

    test('enables submit button when required fields are filled', () => {
      render(
        <UnifiedAddForm
          fields={simpleFields}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          submitLabel="Save"
        />
      );

      const input = screen.getByPlaceholderText('Enter test...');
      fireEvent.change(input, { target: { value: 'Test value' } });

      const submitButton = screen.getByText('Save');
      expect(submitButton).not.toBeDisabled();
    });

    test('clears form after successful submission', () => {
      render(
        <UnifiedAddForm
          fields={simpleFields}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          submitLabel="Save"
        />
      );

      const input = screen.getByPlaceholderText('Enter test...');
      fireEvent.change(input, { target: { value: 'Test value' } });
      
      const submitButton = screen.getByText('Save');
      fireEvent.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledWith({ test: 'Test value' }, false);
      expect(input).toHaveValue('');
    });

    test('calls onCancel when cancel button is clicked', () => {
      render(
        <UnifiedAddForm
          fields={simpleFields}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          submitLabel="Save"
        />
      );

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    test('has consistent grey styling', () => {
      render(
        <UnifiedAddForm
          fields={simpleFields}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          submitLabel="Save"
        />
      );

      const form = document.querySelector('.border-dashed');
      expect(form).toHaveClass('border-gray-300');
      expect(form).toHaveClass('bg-gray-50');
      expect(form).toHaveClass('animate-fadeIn');

      const input = screen.getByPlaceholderText('Enter test...');
      expect(input).toHaveClass('border-gray-300');
      expect(input).toHaveClass('focus:border-gray-500');
    });
  });
});