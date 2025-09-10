import { UnifiedAddForm, FieldConfig } from '@/components/UnifiedAddForm';

interface NewTaskFormProps {
  // third parameter keepOpen: when true, parent should keep the form open after submit
  onAddTask: (title: string, description: string, keepOpen?: boolean) => void;
  onCancel: () => void;
}

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

export function NewTaskForm({ onAddTask, onCancel }: NewTaskFormProps) {
  const handleSubmit = (values: Record<string, string>, keepOpen?: boolean) => {
    onAddTask(values.title, values.description, keepOpen);
  };

  return (
    <UnifiedAddForm
      fields={taskFields}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      submitLabel="Save Task"
      autoFocus={true}
    />
  );
}
