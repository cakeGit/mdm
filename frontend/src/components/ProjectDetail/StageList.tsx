import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StageCard } from './StageCard';
import { NewStageForm } from './NewStageForm';
import { ProjectWithDetails, Stage, Task } from '@/types';

interface StageListProps {
  project: ProjectWithDetails;
  onAddStage: (name: string, description: string, keepOpen?: boolean) => void;
  onUpdateStage: (stageId: number, data: Partial<Stage>) => void;
  onAddTask: (stageId: number, title: string, description: string, keepOpen?: boolean) => void;
  onUpdateTask: (taskId: number, data: Partial<Task>) => void;
  onReorderTasks: (stageId: number, taskIds: number[]) => void;
}

export function StageList({ 
  project, 
  onAddStage, 
  onUpdateStage, 
  onAddTask, 
  onUpdateTask,
  onReorderTasks
}: StageListProps) {
  const [showNewStageForm, setShowNewStageForm] = useState(false);
  const [showCompactView, setShowCompactView] = useState(false);

  const handleAddStage = (name: string, description: string, keepOpen?: boolean) => {
    onAddStage(name, description, keepOpen);
    if (!keepOpen) setShowNewStageForm(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Project Stages</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            size="sm"
            onClick={() => setShowCompactView(!showCompactView)}
            className="text-xs"
          >
            {showCompactView ? 'Expand All' : 'Compact View'}
          </Button>
          <Button onClick={() => setShowNewStageForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Stage
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {project.stages && project.stages.length > 0 ? (
          <>
            {project.stages.map(stage => (
              <StageCard 
                key={stage.id} 
                stage={stage} 
                showCompactView={showCompactView}
                onUpdateStage={onUpdateStage}
                onAddTask={onAddTask}
                onUpdateTask={onUpdateTask}
                onReorderTasks={onReorderTasks}
              />
            ))}
            {showNewStageForm && (
              <NewStageForm 
                onAddStage={handleAddStage}
                onCancel={() => setShowNewStageForm(false)}
              />
            )}
          </>
        ) : (
          <>
            <Card>
              <CardContent className="text-center p-8">
                <h3 className="font-semibold mb-2">No stages yet</h3>
                <p className="text-muted-foreground mb-4">Create your first stage to organize your mod development.</p>
                <Button onClick={() => setShowNewStageForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Stage
                </Button>
              </CardContent>
            </Card>
            {showNewStageForm && (
              <NewStageForm 
                onAddStage={handleAddStage}
                onCancel={() => setShowNewStageForm(false)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
