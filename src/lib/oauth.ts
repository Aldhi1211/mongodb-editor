// OAuth (Google + GitHub) — authorization-code flow.
// We run the dance ourselves and then issue the SAME JWT the email/password
// login issues, so the rest of the app (Authorization: Bearer + localStorage) is unchanged.

export type OAuthProvider = "google" | "github";

export function isProvider(value: string): value is OAuthProvider {
  return value === "google" || value === "github";
}

export interface ProviderConfig {
  clientId?: string;
  clientSecret?: string;
  authorizeUrl: string;
  tokenUrl: string;
  scope: string;
  redirectUri: string;
}

export function getProviderConfig(provider: OAuthProvider, origin: string): ProviderConfig {
  const redirectUri = `${origin}/api/auth/oauth/${provider}/callback`;

  if (provider === "google") {
    return {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      scope: "openid email profile",
      redirectUri,
    };
  }

  return {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    authorizeUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    scope: "read:user user:email",
    redirectUri,
  };
}

/** Exchange an authorization code for an access token. */
export async function exchangeCodeForToken(
  provider: OAuthProvider,
  cfg: ProviderConfig,
  code: string,
): Promise<string | null> {
  const body = new URLSearchParams({
    client_id: cfg.clientId || "",
    client_secret: cfg.clientSecret || "",
    code,
    redirect_uri: cfg.redirectUri,
    grant_type: "authorization_code",
  });

  const res = await fetch(cfg.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.access_token ?? null;
}

/** Resolve a verified email address from the provider using the access token. */
export async function fetchVerifiedEmail(
  provider: OAuthProvider,
  accessToken: string,
): Promise<string | null> {
  if (provider === "google") {
    const res = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.email || data.email_verified === false) return null;
    return data.email as string;
  }

  // GitHub: the primary email is not always on /user, so query /user/emails.
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "mongodb-editor",
  };

  const emailsRes = await fetch("https://api.github.com/user/emails", { headers });
  if (emailsRes.ok) {
    const emails = await emailsRes.json();
    if (Array.isArray(emails)) {
      const primary = emails.find((e: any) => e.primary && e.verified);
      if (primary?.email) return primary.email as string;
      const anyVerified = emails.find((e: any) => e.verified);
      if (anyVerified?.email) return anyVerified.email as string;
    }
  }

  // Fallback to the public profile email.
  const userRes = await fetch("https://api.github.com/user", { headers });
  if (userRes.ok) {
    const user = await userRes.json();
    if (user.email) return user.email as string;
  }

  return null;
}
