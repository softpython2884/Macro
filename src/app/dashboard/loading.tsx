import { MacroLogo } from "@/components/macro-logo";

export default function Loading() {
  return (
    <div className="flex h-full w-full flex-1 items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <MacroLogo className="h-16 w-16 animate-pulse text-primary" />
        <p className="text-muted-foreground">Loading Universe...</p>
      </div>
    </div>
  );
}
