"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type ErrorInfo = {
  title: string;
  detail?: string;
};

type ErrorContextType = {
  showError: (title: string, detail?: string) => void;
};

const ErrorContext = createContext<ErrorContextType>({
  showError: () => {},
});

export function useError() {
  return useContext(ErrorContext);
}

export function ErrorProvider({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState<ErrorInfo | null>(null);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showError = useCallback((title: string, detail?: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setError({ title, detail });
    setVisible(true);
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    timerRef.current = setTimeout(() => setError(null), 200);
  }, []);

  // Catch unhandled promise rejections globally
  useEffect(() => {
    const handler = (e: PromiseRejectionEvent) => {
      const msg = e.reason?.message || String(e.reason) || "Unhandled error";
      // Filter out noisy browser / Next.js internals
      if (msg.includes("ResizeObserver") || msg.includes("hydrat")) return;
      showError("Something went wrong", msg);
    };
    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, [showError]);

  return (
    <ErrorContext.Provider value={{ showError }}>
      {children}
      {error && (
        <ErrorModal
          title={error.title}
          detail={error.detail}
          visible={visible}
          onClose={dismiss}
        />
      )}
    </ErrorContext.Provider>
  );
}

// ── Modal ──────────────────────────────────────────────────────────────────

function ErrorModal({
  title,
  detail,
  visible,
  onClose,
}: {
  title: string;
  detail?: string;
  visible: boolean;
  onClose: () => void;
}) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
      style={{
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.15s ease",
        pointerEvents: visible ? "auto" : "none",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          transform: visible ? "scale(1) translateY(0)" : "scale(0.96) translateY(8px)",
          transition: "transform 0.15s ease",
        }}
        className="bg-[#111] border border-[#222] rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
      >
        {/* Red accent bar */}
        <div className="h-1 bg-gradient-to-r from-red-500 to-rose-600" />

        {/* Header */}
        <div className="flex items-start gap-3 px-5 pt-5 pb-4">
          <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
            {/* Inline SVG to avoid import */}
            <svg className="w-4.5 h-4.5 text-red-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[14px] font-semibold text-white leading-tight">{title}</h2>
            {detail && (
              <p className="text-[11px] text-[#666] mt-1.5 leading-relaxed break-words line-clamp-4">
                {detail}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex justify-end">
          <button
            onClick={onClose}
            autoFocus
            className="px-4 py-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] hover:border-[#333] text-[12px] font-medium text-[#aaa] hover:text-white transition-all cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
