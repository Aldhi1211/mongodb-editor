import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import clientPromise from "@/lib/mongodb";
import {
  getProviderConfig,
  isProvider,
  exchangeCodeForToken,
  fetchVerifiedEmail,
} from "@/lib/oauth";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ provider: string }> },
) {
  const { provider } = await ctx.params;
  const origin = req.nextUrl.origin;

  const fail = (code: string) =>
    NextResponse.redirect(`${origin}/login?error=${code}`);

  if (!isProvider(provider)) return fail("oauth_unknown_provider");

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const cookieState = req.cookies.get(`oauth_state_${provider}`)?.value;

  if (req.nextUrl.searchParams.get("error")) return fail("oauth_denied");
  if (!code || !state || !cookieState || state !== cookieState) {
    return fail("oauth_state");
  }

  const cfg = getProviderConfig(provider, origin);
  if (!cfg.clientId || !cfg.clientSecret) return fail("oauth_not_configured");

  try {
    const accessToken = await exchangeCodeForToken(provider, cfg, code);
    if (!accessToken) return fail("oauth_token");

    const email = await fetchVerifiedEmail(provider, accessToken);
    if (!email) return fail("oauth_no_email");

    const client = await clientPromise;
    const db = client.db("workflowbuilder_auth");

    let user = await db.collection("users").findOne({ email });
    if (!user) {
      const doc = {
        email,
        role: "owner",
        oauthProvider: provider,
        createdAt: new Date(),
      };
      const result = await db.collection("users").insertOne(doc);
      user = { _id: result.insertedId, ...doc };
    }

    const token = jwt.sign(
      { userId: user._id.toString(), role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "8h" },
    );

    // Pass the token via URL fragment (not sent to servers, not logged) so the
    // client page can drop it into localStorage exactly like the password flow.
    const res = NextResponse.redirect(`${origin}/auth/callback#token=${token}`);
    res.cookies.delete(`oauth_state_${provider}`);
    return res;
  } catch (err) {
    console.error("OAUTH CALLBACK ERROR:", err);
    return fail("oauth_failed");
  }
}
