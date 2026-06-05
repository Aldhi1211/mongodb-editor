import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getProviderConfig, isProvider } from "@/lib/oauth";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ provider: string }> },
) {
  const { provider } = await ctx.params;
  const origin = req.nextUrl.origin;

  if (!isProvider(provider)) {
    return NextResponse.redirect(`${origin}/login?error=oauth_unknown_provider`);
  }

  const cfg = getProviderConfig(provider, origin);
  if (!cfg.clientId || !cfg.clientSecret) {
    return NextResponse.redirect(`${origin}/login?error=oauth_not_configured`);
  }

  const state = randomUUID();

  const authUrl = new URL(cfg.authorizeUrl);
  authUrl.searchParams.set("client_id", cfg.clientId);
  authUrl.searchParams.set("redirect_uri", cfg.redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", cfg.scope);
  authUrl.searchParams.set("state", state);
  if (provider === "google") {
    authUrl.searchParams.set("access_type", "online");
    authUrl.searchParams.set("prompt", "select_account");
  }

  const res = NextResponse.redirect(authUrl.toString());
  res.cookies.set(`oauth_state_${provider}`, state, {
    httpOnly: true,
    secure: origin.startsWith("https"),
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}
