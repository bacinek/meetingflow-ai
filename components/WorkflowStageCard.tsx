import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type WorkflowStageCardProps = {
  step: number;
  title: string;
  description: string;
  titleId: string;
  sectionId?: string;
  children: ReactNode;
  tone?: "default" | "muted" | "dashed";
};

export function WorkflowStageCard({
  step,
  title,
  description,
  titleId,
  sectionId,
  children,
  tone = "default",
}: WorkflowStageCardProps) {
  return (
    <Card
      id={sectionId}
      className={cn(
        "workflow-stage gap-0 py-0 shadow-md [--card-spacing:--spacing(5)] ring-0",
        tone === "muted" && "bg-muted/30",
        tone === "dashed" && "border-dashed bg-muted/20",
      )}
    >
      <CardHeader className="workflow-stage-header gap-3 border-b border-border bg-muted/80 pb-4">
        <div className="flex items-start gap-3">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary text-sm font-semibold tabular-nums text-primary-foreground shadow-sm"
            aria-hidden
          >
            {step}
          </span>
          <div className="min-w-0 space-y-1">
            <CardTitle id={titleId} className="text-lg font-semibold">
              {title}
            </CardTitle>
            <CardDescription className="text-foreground/70">
              {description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="workflow-stage-body bg-card pt-5 pb-5">
        {children}
      </CardContent>
    </Card>
  );
}
