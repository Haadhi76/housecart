import { cn } from "@/lib/utils";

export function SkeletonLine({ className }: { className?: string }) {
  return (
    <div className={cn("h-4 animate-pulse rounded bg-gray-200", className)} />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl border border-gray-100 bg-gray-50 p-4",
        className
      )}
    >
      <div className="h-4 w-3/4 rounded bg-gray-200" />
      <div className="mt-2 h-3 w-1/2 rounded bg-gray-200" />
      <div className="mt-4 h-3 w-full rounded bg-gray-200" />
    </div>
  );
}

export function SkeletonList({
  rows = 5,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-5 w-5 animate-pulse rounded bg-gray-200" />
          <div className="h-4 flex-1 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-12 animate-pulse rounded bg-gray-200" />
        </div>
      ))}
    </div>
  );
}
