import { SegmentedProgressBar } from '@/components/SegmentedProgressBar';
import { ProjectWithDetails } from '@/types';

interface ProjectProgressProps {
  project: ProjectWithDetails;
}

export function ProjectProgress({ project }: ProjectProgressProps) {
  const allTasks = project.stages?.flatMap(stage => stage.tasks || []) || [];
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter(task => task.status === 'completed').length;
  const overallProgress = project.progress || 0;
  const stageProgress = project.stageProgress || [];

  return (
    <div className="flex gap-4">
      <div className="flex-1">
        <div className="flex justify-between text-sm mb-1">
          <span>Overall Progress</span>
          <span>{completedTasks}/{totalTasks} tasks</span>
        </div>
        <SegmentedProgressBar stageProgress={stageProgress} className="mb-2" />
        <div className="text-xs text-gray-600 text-center">
          {overallProgress.toFixed(1)}% complete
        </div>
      </div>
    </div>
  );
}
