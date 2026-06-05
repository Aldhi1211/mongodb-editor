import s from "./montra.module.css";
import BrandPanel from "./BrandPanel";

function BrandMark() {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="30" height="30" rx="8" fill="#0A0A0A" />
      <path
        d="M16 12.9V16M16 16L11 19.5M16 16L21 19.5"
        stroke="#FFFFFF"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="10.6" r="2.05" fill="#FFFFFF" />
      <circle cx="10.6" cy="21.4" r="2.05" fill="#FFFFFF" />
      <circle cx="21.4" cy="21.4" r="2.05" fill="#FFFFFF" />
    </svg>
  );
}

export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${s.root} min-h-screen w-full bg-white text-neutral-950 lg:grid lg:grid-cols-[55%_45%]`}>
      {/* LEFT · FORM */}
      <main className="relative flex min-h-screen flex-col px-6 py-8 sm:px-10 lg:px-16 lg:py-10">
        {/* Brand mark */}
        <header className={`${s.rise} flex items-center gap-2.5`}>
          <BrandMark />
          <span className="text-[17px] font-semibold tracking-tight text-neutral-950">Montra</span>
        </header>

        {/* Card */}
        <div className="flex flex-1 items-center justify-center py-10">
          <div className={`${s.rise} ${s.d1} w-full max-w-[400px]`}>{children}</div>
        </div>

        {/* Status line */}
        <footer className="flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-neutral-300" />
          <span className={`${s.mono} text-xs text-neutral-400`}>
            v2.4.1 · all systems operational
          </span>
        </footer>
      </main>

      {/* RIGHT · BRAND */}
      <BrandPanel />
    </div>
  );
}
