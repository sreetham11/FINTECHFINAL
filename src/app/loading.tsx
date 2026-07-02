export default function Loading() {
  return (
    <div
      className="min-height-100dvh flex flex-col justify-center items-center px-4"
      style={{ background: '#F7F4EF' }}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-10 h-10 border-4 border-[#1A1A1A] border-t-[#C0001F] rounded-full animate-spin"
          aria-hidden="true"
        />
        <div className="font-space-mono text-xs uppercase tracking-[0.2em] text-[#555]">
          Loading…
        </div>
      </div>
      <span className="sr-only">Loading, please wait.</span>
    </div>
  );
}
