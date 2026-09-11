import Link from "next/link";

import { MeetingWorkflow } from "@/components/MeetingWorkflow";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="app-page-header">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6 sm:px-6 sm:py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
                MeetingFlow AI
              </h1>
              <p className="text-muted-foreground">
                AI podprta obdelava zapisnikov sestankov
              </p>
            </div>
            <Link
              href="/business-system"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "shrink-0 cursor-pointer self-start px-3 py-2",
              )}
            >
              Poslovni sistem
            </Link>
          </div>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Prilepite ali naložite digitalni transkript sestanka. Umetna
            inteligenca pripravi strukturirane podatke za pregled, popravke in
            potrditev pred prenosom v interni poslovni sistem.
          </p>
        </div>
      </header>

      <MeetingWorkflow />
    </div>
  );
}
