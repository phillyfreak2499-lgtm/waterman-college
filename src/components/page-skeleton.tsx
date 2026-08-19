export function PageSkeleton({ label = "Loading" }: { label?: string }) {
  return (
    <div className="mx-auto max-w-3xl px-5 py-20" aria-busy="true" aria-label={label}>
      <div className="h-2 w-16 rounded-full bg-brass/25" />
      <div className="mt-5 h-10 w-64 max-w-full animate-pulse rounded-sm bg-navy/8" />
      <div className="mt-4 h-4 w-full max-w-md animate-pulse rounded-sm bg-navy/5" />
      <div className="mt-8 h-40 animate-pulse rounded-md bg-navy/5" />
    </div>
  );
}
