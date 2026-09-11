"use client";

import { ChevronDown } from "lucide-react";
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
  collapsible?: boolean;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  contentId?: string;
};

export function WorkflowStageCard({
  step,
  title,
  description,
  titleId,
  sectionId,
  children,
  tone = "default",
  collapsible = false,
  expanded = true,
  onExpandedChange,
  contentId,
}: WorkflowStageCardProps) {
  const showBody = !collapsible || expanded;

  const headerInner = (
    <>
      {collapsible ? (
        <ChevronDown
          aria-hidden
          className={cn(
            "size-5 shrink-0 text-muted-foreground transition-transform",
            expanded ? "mt-2 rotate-180" : "",
          )}
        />
      ) : null}
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
        {!collapsible || expanded ? (
          <CardDescription className="text-foreground/70">
            {description}
          </CardDescription>
        ) : null}
      </div>
    </>
  );

  return (
    <Card
      id={sectionId}
      className={cn(
        "workflow-stage gap-0 py-0 shadow-md [--card-spacing:--spacing(5)] ring-0",
        tone === "muted" && "bg-muted/30",
        tone === "dashed" && "border-dashed bg-muted/20",
      )}
    >
      <CardHeader
        className={cn(
          "workflow-stage-header gap-0 bg-muted/80 p-0",
          showBody && "border-b border-border",
        )}
      >
        {collapsible ? (
          <button
            type="button"
            className={cn(
              "flex w-full gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/40 sm:px-5",
              expanded ? "items-start" : "items-center",
            )}
            aria-expanded={expanded}
            aria-controls={contentId}
            onClick={() => onExpandedChange?.(!expanded)}
          >
            {headerInner}
          </button>
        ) : (
          <div className="flex items-start gap-3 px-4 py-4 sm:px-5">
            {headerInner}
          </div>
        )}
      </CardHeader>
      {showBody ? (
        <CardContent
          id={contentId}
          className="workflow-stage-body bg-card pt-5 pb-5"
        >
          {children}
        </CardContent>
      ) : null}
    </Card>
  );
}
