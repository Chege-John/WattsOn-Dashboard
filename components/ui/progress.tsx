"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  getValueLabel?: (value: number, max: number) => string;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, getValueLabel, ...props }, ref) => {
    // Validate max value
    const validMax = max > 0 ? max : 100;

    // Clamp value between 0 and max
    const clampedValue = Math.max(0, Math.min(validMax, value ?? 0));

    // Calculate percentage for styling
    const percentage = (clampedValue / validMax) * 100;
    const percentageRemaining = 100 - percentage;
    const transformValue = `translateX(-${percentageRemaining}%)`;

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={validMax}
        aria-valuenow={clampedValue}
        aria-valuetext={
          getValueLabel
            ? getValueLabel(clampedValue, validMax)
            : `${percentage}%`
        }
        className={cn(
          "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
          className
        )}
        {...props}
      >
        <div
          className="h-full w-full flex-1 bg-primary transition-all"
          style={{ transform: transformValue }}
        />
      </div>
    );
  }
);

Progress.displayName = "Progress";

export { Progress };
