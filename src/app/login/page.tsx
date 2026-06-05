"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import {
  GitHubIcon,
  GoogleIcon,
  EyeOpenIcon,
  EyeOffIcon,
  ErrorIcon,
} from "@/components/auth/AuthIcons";
import s from "@/components/auth/montra.module.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const OAUTH_ERRORS: Record<string, string> = {
  oauth: "Sign-in was interrupted. Please try again.",
  oauth_denied: "Sign-in was cancelled.",
  oauth_state: "Sign-in session expired. Please try again.",
  oauth_token: "Could not complete sign-in with the provider.",
  oauth_no_email: "No verified email was returned by the provider.",
  oauth_not_configured: "Social sign-in is not configured yet.",
  oauth_unknown_provider: "Unknown sign-in provider.",
  oauth_failed: "Sign-in failed. Please try again.",
};

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailInvalid = email.length > 0 && !EMAIL_RE.test(email);

  // Surface OAuth errors passed back via ?error= from the callback routes.
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("error");
    if (code && OAUTH_ERRORS[code]) {
      setError(OAUTH_ERRORS[code]);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const oauthSignIn = (provider: "google" | "github") => {
    window.location.href = `/api/auth/oauth/${provider}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);

    if (!EMAIL_RE.test(email)) {
      setError("Enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Sign in failed.");
        setLoading(false);
        return;
      }
      localStorage.setItem("token", data.token);
      router.push("/");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="mb-7">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">Sign in to Montra</h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          Connect to your clusters and pick up where you left off.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* OAuth */}
        <div className="space-y-3">
          <button type="button" className={s.btnOauth} onClick={() => oauthSignIn("github")}>
            <GitHubIcon />
            Continue with GitHub
          </button>

          <button type="button" className={s.btnOauth} onClick={() => oauthSignIn("google")}>
            <GoogleIcon />
            Continue with Google
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <span className="h-px flex-1 bg-neutral-200" />
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-400">
            or
          </span>
          <span className="h-px flex-1 bg-neutral-200" />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-neutral-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={emailInvalid || undefined}
            aria-describedby={emailInvalid ? "email-error" : undefined}
            className={`${s.field} ${emailInvalid ? s.isError : ""}`}
          />
          {emailInvalid && (
            <p id="email-error" className="mt-1.5 flex items-center gap-1.5 text-xs text-[#DC2626]">
              <ErrorIcon />
              Enter a valid email address.
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-neutral-700">
              Password
            </label>
            <a
              href="#"
              className="text-sm font-medium text-neutral-900 underline-offset-4 hover:underline"
            >
              Forgot password?
            </a>
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${s.field} ${s.fieldPw}`}
            />
            <button
              type="button"
              aria-label={showPw ? "Hide password" : "Show password"}
              aria-pressed={showPw}
              onClick={() => setShowPw((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-neutral-400 transition-colors hover:text-neutral-900"
            >
              {showPw ? <EyeOffIcon /> : <EyeOpenIcon />}
            </button>
          </div>
        </div>

        {/* Remember */}
        <label className="flex cursor-pointer select-none items-center gap-2.5 text-sm text-neutral-700">
          <input
            type="checkbox"
            name="remember"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className={s.checkbox}
          />
          Remember this device
        </label>

        {/* Server / submit error */}
        {error && (
          <p className="flex items-center gap-1.5 text-xs text-[#DC2626]">
            <ErrorIcon />
            {error}
          </p>
        )}

        {/* Submit */}
        <button type="submit" disabled={loading} className={s.btnPrimary}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      {/* Footer */}
      <p className="mt-6 text-center text-sm text-neutral-600">
        New to Montra?{" "}
        <Link href="/register" className="font-medium text-neutral-900 underline underline-offset-4">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
