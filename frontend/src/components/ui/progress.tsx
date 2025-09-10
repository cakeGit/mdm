import * as React from "react"

import { cn } from "@/lib/utils"
import { SegmentedProgressBar } from '@/components/SegmentedProgressBar'
import { StageProgress } from '@/types'

type ProgressProps = React.HTMLAttributes<HTMLDivElement> & {
  value?: number;
  stageProgress?: StageProgress[];
  className?: string;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(({ className = '', value = 0, stageProgress, ...props }, ref) => {
  // If a stageProgress array isn't provided, treat the numeric value as a single segment
  let segments: StageProgress[] | undefined = stageProgress;

  if (!segments || segments.length === 0) {
    const numeric = Math.max(0, Math.min(100, Number(value || 0)));
    segments = [
      {
        id: -1,
        name: 'Progress',
        progress: numeric,
        weight: 1,
      },
    ];
  }

  return (
    <div ref={ref} className={cn('w-full', className)} {...props}>
      {/* Inner bar fills the wrapper height so callers can control height via the wrapper's className */}
      <SegmentedProgressBar stageProgress={segments} className="h-full" />
    </div>
  );
});
Progress.displayName = 'Progress'

export { Progress }