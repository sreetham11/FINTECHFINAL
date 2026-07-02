import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      className="min-height-100dvh flex flex-col justify-center items-center px-4 text-center"
      style={{ background: '#F7F4EF' }}
    >
      <div className="w-full max-w-md bg-white border-[3px] border-[#1A1A1A] p-8 box-shadow-[8px_8px_0_0_#1A1A1A]">
        <div className="font-mono text-[0.75rem] uppercase tracking-[0.2em] text-[#C0001F] font-bold mb-2">
          404
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#1A1A1A] uppercase mb-3">
          Page <span className="text-[#C0001F]">Not Found</span>
        </h1>
        <p className="text-[#555] font-space-mono text-xs mb-6">
          This tap didn&apos;t lead anywhere. Let&apos;s get you back on track.
        </p>
        <Link
          href="/"
          className="inline-block w-full bg-[#C0001F] text-white border-2 border-[#1A1A1A] py-3.5 px-6 font-space-mono font-bold uppercase tracking-wider text-sm hover:bg-[#A00018] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_0_#1A1A1A] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all duration-150"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
