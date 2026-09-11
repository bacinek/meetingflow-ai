import { Lock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const WORKFLOW_STEPS = [
  { id: 1, label: "Vnos transkripta" },
  { id: 2, label: "AI analiza" },
  { id: 3, label: "Pregled in potrditev" },
  { id: 4, label: "Prenos v poslovni sistem" },
  { id: 5, label: "Follow-up sporočilo" },
] as const;

type WorkflowStepperProps = {
  currentStep?: number;
  analysisComplete?: boolean;
  onStepClick?: (stepId: number) => void;
};

function isStepLocked(stepId: number, analysisComplete: boolean) {
  return stepId >= 3 && !analysisComplete;
}

export function WorkflowStepper({
  currentStep = 1,
  analysisComplete = false,
  onStepClick,
}: WorkflowStepperProps) {
  return (
    <nav
      aria-label="Koraki delovnega postopka"
      className="sticky top-0 z-10 border-b border-border bg-card/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/90"
    >
      <ol className="mx-auto flex max-w-5xl flex-wrap items-stretch gap-2 px-4 py-3 sm:gap-3 sm:px-6">
        {WORKFLOW_STEPS.map((step) => {
          const locked = isStepLocked(step.id, analysisComplete);
          const isCurrent = step.id === currentStep;
          const isComplete = step.id < currentStep;

          return (
            <li key={step.id} className="min-w-0 flex-1 sm:flex-none">
              <button
                type="button"
                disabled={locked}
                aria-current={isCurrent ? "step" : undefined}
                aria-disabled={locked}
                onClick={() => {
                  if (!locked) {
                    onStepClick?.(step.id);
                  }
                }}
                className={cn(
                  "flex w-full min-w-0 items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs transition-colors sm:text-sm",
                  isCurrent &&
                    "border-primary bg-card shadow-md ring-2 ring-primary/20",
                  !isCurrent &&
                    !locked &&
                    "cursor-pointer border-border bg-background hover:border-primary/30 hover:bg-card",
                  locked &&
                    "cursor-not-allowed border-border bg-muted/50 opacity-70",
                  isComplete && !isCurrent && "text-muted-foreground",
                )}
              >
                <Badge
                  variant={isCurrent ? "default" : "outline"}
                  className="size-6 shrink-0 justify-center rounded-full p-0 tabular-nums"
                >
                  {step.id}
                </Badge>
                <span className="min-w-0 flex-1 truncate font-medium leading-tight">
                  {step.label}
                </span>
                {locked ? (
                  <Lock
                    className="size-3.5 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                ) : null}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
