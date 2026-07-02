'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      className="min-height-100dvh flex flex-col justify-center items-center px-4 text-center"
      style={{ background: '#F7F4EF' }}
    >
      <div className="w-full max-w-md bg-white border-[3px] border-[#1A1A1A] p-8 box-shadow-[8px_8px_0_0_#1A1A1A]">
        <div className="font-mono text-[0.75rem] uppercase tracking-[0.2em] text-[#C0001F] font-bold mb-2">
          Something broke
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#1A1A1A] uppercase mb-3">
          Unexpected <span className="text-[#C0001F]">Error</span>
        </h1>
        <p className="text-[#555] font-space-mono text-xs mb-6">
          We hit a snag loading this page. You can try again — if it keeps
          happening, please let us know.
        </p>
        <button
          onClick={reset}
          className="w-full bg-[#C0001F] text-white border-2 border-[#1A1A1A] py-3.5 px-6 font-space-mono font-bold uppercase tracking-wider text-sm hover:bg-[#A00018] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_0_#1A1A1A] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all duration-150"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
