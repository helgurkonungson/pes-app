/**
 * Google sign-in inside the app, only to get a one-time access token for creating
 * the learner's Gemini key. Android: Credential Manager + AuthorizationClient (a native
 * sheet, no browser); iOS: Google Sign-In in an in-app sheet. Embedded WebView sign-in
 * is blocked by Google, so it is never used. Nothing is stored; we sign out right away.
 */
import { Capacitor } from "@capacitor/core";
import { GOOGLE_IOS_CLIENT_ID as IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID as WEB_CLIENT_ID } from "../build";

/** True when the one-tap flow can run here (native app + OAuth client configured at build time). */
export function googleSignInAvailable(): boolean {
  const platform = Capacitor.getPlatform();
  if (platform === "android") return !!WEB_CLIENT_ID;
  if (platform === "ios") return !!IOS_CLIENT_ID;
  return false;
}

export class GoogleSignInCancelled extends Error {}

export async function googleAccessToken(scopes: string[]): Promise<string> {
  const { SocialLogin } = await import("@capgo/capacitor-social-login");
  await SocialLogin.initialize({ google: { webClientId: WEB_CLIENT_ID || undefined, iOSClientId: IOS_CLIENT_ID || undefined, mode: "online" } });
  try {
    const res = await SocialLogin.login({ provider: "google", options: { scopes, forceRefreshToken: true, forcePrompt: true } });
    const token = (res.result as { accessToken?: { token?: string } | null }).accessToken?.token;
    if (!token) throw new Error("Google returned no access token.");
    return token;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/cancel|dismiss|16:|12501/i.test(msg)) throw new GoogleSignInCancelled(msg);
    throw e;
  } finally {
    // the token was needed once; don't keep a Google session in the app
    void SocialLogin.logout({ provider: "google" }).catch(() => undefined);
  }
}
