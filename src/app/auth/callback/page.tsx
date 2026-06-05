"use client";

import { useEffect } from "react";

export default function OAuthCallbackPage() {
  useEffect(() => {
    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : "";
    const token = new URLSearchParams(hash).get("token");

    if (token) {
      localStorage.setItem("token", token);
      window.location.replace("/");
    } else {
      window.location.replace("/login?error=oauth");
    }
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#ffffff",
        color: "#525252",
        fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
        fontSize: 14,
      }}
    >
      Signing you in…
    </div>
  );
}
