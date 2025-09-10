import { UnifiedAddForm, FieldConfig } from '@/components/UnifiedAddForm';

interface NewStageFormProps {
  onAddStage: (name: string, description: string, keepOpen?: boolean) => void;
  onCancel: () => void;
}

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

export function NewStageForm({ onAddStage, onCancel }: NewStageFormProps) {
  const handleSubmit = (values: Record<string, string>, keepOpen?: boolean) => {
    onAddStage(values.name, values.description, keepOpen);
  };

  return (
    <UnifiedAddForm
      fields={stageFields}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      submitLabel="Save Stage"
      autoFocus={true}
    />
  );
}
