import Link from "next/link";

import { BusinessSystemMeetings } from "@/components/BusinessSystemMeetings";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function BusinessSystemPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="app-page-header">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6 sm:px-6 sm:py-8">
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "-ml-2 w-fit cursor-pointer px-3 py-2",
            )}
          >
            Nazaj na obdelavo
          </Link>
          <div className="space-y-2">
            <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              Interni poslovni sistem – demo
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Prikaz sestankov, ki so bili uspešno preneseni prek poslovnega
              API-ja. Ta stran služi kot dokaz, da so potrjene informacije
              prispale v interni sistem.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <BusinessSystemMeetings />
      </main>
    </div>
  );
}
