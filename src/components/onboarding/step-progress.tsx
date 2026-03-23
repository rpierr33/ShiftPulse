"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface StepProgressProps {
  steps: string[];
  currentStep: number;
  completedSteps: number[];
}

export function StepProgress({ steps, currentStep, completedSteps }: StepProgressProps) {
  return (
    <div className="w-full">
      {/* Desktop */}
      <div className="hidden sm:flex items-center justify-center gap-0">
        {steps.map((label, index) => {
          const stepNum = index + 1;
          const isCompleted = completedSteps.includes(stepNum);
          const isCurrent = currentStep === stepNum;
          const isUpcoming = !isCompleted && !isCurrent;

          return (
            <div key={label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300",
                    isCompleted && "bg-emerald-500 text-white",
                    isCurrent && "bg-blue-600 text-white ring-4 ring-blue-100",
                    isUpcoming && "bg-gray-200 text-gray-500"
                  )}
                >
                  {isCompleted ? <Check className="h-5 w-5" /> : stepNum}
                </div>
                <span
                  className={cn(
                    "mt-2 text-xs font-medium max-w-[80px] text-center leading-tight",
                    isCompleted && "text-emerald-600",
                    isCurrent && "text-blue-600",
                    isUpcoming && "text-gray-400"
                  )}
                >
                  {label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 w-12 mx-2 mt-[-20px] transition-colors duration-300",
                    isCompleted ? "bg-emerald-500" : "bg-gray-200"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile */}
      <div className="flex sm:hidden items-center justify-between px-2">
        <span className="text-sm font-medium text-blue-600">
          Step {currentStep} of {steps.length}
        </span>
        <span className="text-sm text-gray-500">{steps[currentStep - 1]}</span>
      </div>
      <div className="flex sm:hidden mt-2 gap-1.5 px-2">
        {steps.map((label, index) => {
          const stepNum = index + 1;
          const isCompleted = completedSteps.includes(stepNum);
          const isCurrent = currentStep === stepNum;

          return (
            <div
              key={label}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors duration-300",
                isCompleted && "bg-emerald-500",
                isCurrent && "bg-blue-600",
                !isCompleted && !isCurrent && "bg-gray-200"
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
