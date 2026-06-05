"use client";

import { useState } from "react";
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

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const emailInvalid = email.length > 0 && !EMAIL_RE.test(email);

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
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed.");
        setLoading(false);
        return;
      }
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  if (done) {
    return (
      <AuthShell>
        <div className="mb-7">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">
            Account created
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            Your Montra account is ready. Sign in to connect to your clusters.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/login")}
          className={s.btnPrimary}
        >
          Continue to sign in
        </button>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="mb-7">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">
          Create your account
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          Get started with Montra — the fastest way to work with MongoDB.
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
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-neutral-700">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              placeholder="At least 8 characters"
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

        {/* Server / submit error */}
        {error && (
          <p className="flex items-center gap-1.5 text-xs text-[#DC2626]">
            <ErrorIcon />
            {error}
          </p>
        )}

        {/* Submit */}
        <button type="submit" disabled={loading} className={s.btnPrimary}>
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      {/* Footer */}
      <p className="mt-6 text-center text-sm text-neutral-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-neutral-900 underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
