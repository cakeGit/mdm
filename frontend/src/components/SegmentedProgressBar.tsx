import { StageProgress } from '@/types';

interface SegmentedProgressBarProps {
  stageProgress: StageProgress[];
  className?: string;
}

export function SegmentedProgressBar({ stageProgress, className = '' }: SegmentedProgressBarProps) {
  // Ensure a sensible default height so the bar never collapses when callers omit height classes
  const rootClass = `h-3 bg-gray-200 border border-gray-300 overflow-hidden flex gap-0.5 ${className}`.trim();

  if (stageProgress.length === 0) {
    return (
      <div className={rootClass} style={{ borderRadius: '6px' }}>
        <div className="h-full bg-gray-300 rounded text-xs text-center text-gray-600 flex items-center justify-center">
          No stages
        </div>
      </div>
    );
  }

  const totalWeight = stageProgress.reduce((sum, stage) => sum + stage.weight, 0);

  return (
    <div className={rootClass} style={{ borderRadius: '6px' }}>
      {stageProgress.map((stage, index) => {
        const widthPercentage = (stage.weight / totalWeight) * 100;
        const progressPercentage = stage.progress;
        
        return (
          <div
            key={stage.id}
            className="relative bg-gray-100 rounded-sm"
            style={{ 
              width: `${widthPercentage}%`,
              borderRadius: '4px'
            }}
            title={`${stage.name}: ${progressPercentage.toFixed(1)}% complete`}
          >
            {/* Progress fill */}
            <div
              className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-300 rounded-sm"
              style={{ 
                width: `${progressPercentage}%`,
                borderRadius: '4px'
              }}
            />
          </div>
        );
      })}
    </div>
  );
}