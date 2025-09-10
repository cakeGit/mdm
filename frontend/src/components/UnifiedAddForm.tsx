import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';

export interface FieldConfig {
  key: string;
  label: string;
  placeholder: string;
  type: 'input' | 'textarea';
  required?: boolean;
  allowNewlines?: boolean; // For textarea fields that should allow Shift+Enter for newlines
}

interface UnifiedAddFormProps {
  fields: FieldConfig[];
  onSubmit: (values: Record<string, string>, keepOpen?: boolean) => void;
  onCancel: () => void;
  submitLabel: string;
  autoFocus?: boolean;
}

export function UnifiedAddForm({ 
  fields, 
  onSubmit, 
  onCancel, 
  submitLabel,
  autoFocus = true 
}: UnifiedAddFormProps) {
  const [values, setValues] = useState<Record<string, string>>(
    fields.reduce((acc, field) => ({ ...acc, [field.key]: '' }), {})
  );

  const handleKeyDown = (e: React.KeyboardEvent, field: FieldConfig) => {
    if (e.key === 'Enter') {
      // For textarea fields that allow newlines, Shift+Enter adds newline
      if (field.type === 'textarea' && field.allowNewlines && e.shiftKey) {
        return; // Allow default behavior (newline)
      }
      
      // Otherwise, Enter submits the form
      e.preventDefault();
      handleSubmit(e.shiftKey);
    }
  };

  const handleSubmit = (keepOpen = false) => {
    // Check if required fields are filled
    const requiredFieldsFilled = fields
      .filter(field => field.required)
      .every(field => values[field.key]?.trim());

    if (!requiredFieldsFilled) return;

    // Trim all values before submitting
    const trimmedValues = Object.keys(values).reduce((acc, key) => ({
      ...acc,
      [key]: values[key].trim()
    }), {});

    onSubmit(trimmedValues, keepOpen);

    // Clear form after submission
    setValues(fields.reduce((acc, field) => ({ ...acc, [field.key]: '' }), {}));
  };

  const updateValue = (key: string, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }));
  };

  // Check if form is valid (all required fields filled)
  const isValid = fields
    .filter(field => field.required)
    .every(field => values[field.key]?.trim());

  return (
    <Card className="border-dashed border-2 border-gray-300 bg-gray-50 animate-fadeIn">
      <CardContent className="p-4">
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.key}>
              {field.type === 'input' ? (
                <Input
                  value={values[field.key] || ''}
                  onChange={(e) => updateValue(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="border-gray-300 focus:border-gray-500"
                  onKeyDown={(e) => handleKeyDown(e, field)}
                  autoFocus={autoFocus && index === 0}
                />
              ) : (
                <Textarea
                  value={values[field.key] || ''}
                  onChange={(e) => updateValue(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="border-gray-300 focus:border-gray-500 min-h-[80px]"
                  onKeyDown={(e) => handleKeyDown(e, field)}
                  autoFocus={autoFocus && index === 0}
                />
              )}
            </div>
          ))}
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button 
              size="sm"
              onClick={() => handleSubmit(false)} 
              disabled={!isValid}
            >
              {submitLabel}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}