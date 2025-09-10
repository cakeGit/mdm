import { SegmentedProgressBar } from '@/components/SegmentedProgressBar';
import { ProjectWithDetails } from '@/types';

interface ProjectProgressProps {
  project: ProjectWithDetails;
}

export function ProjectProgress({ project }: ProjectProgressProps) {
  const allTasks = project.stages?.flatMap(stage => stage.tasks || []) || [];
  const completedTasks = allTasks.filter(task => task.status === 'completed').length;
  const stageProgress = project.stageProgress || [];
  const averageStageProgress = stageProgress.length
    ? stageProgress.reduce((sum, sp) => sum + sp.progress, 0) / stageProgress.length
    : 0;

  return (
    <div className="flex gap-4">
      <div className="flex-1">
        <div className="flex justify-between text-sm mb-1">
          <span>Overall Progress</span>
          <span>{averageStageProgress.toFixed(0)}%</span>
        </div>
        <SegmentedProgressBar stageProgress={stageProgress} className="mb-2 h-3" />
        <div className="text-xs text-gray-600 text-center">
          {averageStageProgress.toFixed(1)}% complete
        </div>
      </div>
    </div>
  );
}
