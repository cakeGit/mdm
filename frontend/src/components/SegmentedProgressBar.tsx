import { StageProgress } from '@/types';

interface SegmentedProgressBarProps {
  stageProgress: StageProgress[];
  className?: string;
}

export function SegmentedProgressBar({ stageProgress, className = '' }: SegmentedProgressBarProps) {
  if (stageProgress.length === 0) {
    return (
      <div className={`h-3 bg-gray-200 rounded border border-gray-300 ${className}`}>
        <div className="h-full bg-gray-300 rounded text-xs text-center text-gray-600 flex items-center justify-center">
          No stages
        </div>
      </div>
    );
  }

  const totalWeight = stageProgress.reduce((sum, stage) => sum + stage.weight, 0);

  return (
    <div className={`h-3 bg-gray-200 rounded border border-gray-300 overflow-hidden ${className}`}>
      <div className="flex h-full">
        {stageProgress.map((stage, index) => {
          const widthPercentage = (stage.weight / totalWeight) * 100;
          const progressPercentage = stage.progress;
          
          return (
            <div
              key={stage.id}
              className="relative bg-gray-100"
              style={{ width: `${widthPercentage}%` }}
              title={`${stage.name}: ${progressPercentage.toFixed(1)}% complete`}
            >
              {/* Progress fill */}
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
              
              {/* Stage separator line (except for last stage) */}
              {index < stageProgress.length - 1 && (
                <div className="absolute top-0 right-0 w-px h-full bg-gray-400" />
              )}
              
              {/* Stage label for wider segments */}
              {widthPercentage > 15 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-700 px-1 truncate">
                    {stage.name}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}