import { NextResponse } from "next/server";
import createClient from "@/lib/supabase/server";

/**
 * Validates a redirect path to prevent open redirect attacks.
 * 
 * @param path - The redirect path to validate
 * @returns true if the path is safe for redirection
 */
function isValidRedirectPath(path: string): boolean {
  // Must start with a single forward slash (relative path)
  if (!path.startsWith('/')) return false;

  // Block double slashes which could be interpreted as protocol-relative URLs (//evil.com)
  if (path.startsWith('//')) return false;

  // Block protocol handlers (javascript:, data:, etc.)
  if (path.includes(':')) return false;

  // Block backslashes which some browsers interpret as forward slashes
  if (path.includes('\\')) return false;

  return true;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Get the correct origin from headers (handles proxies like Render)
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || 'https';
  const origin = `${protocol}://${host}`;

  // Extract auth code and optional redirect path
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/";

  // Validate redirect path to prevent open redirect attacks
  const safeRedirect = isValidRedirectPath(rawNext) ? rawNext : "/";

  if (code) {
    const supabase = await createClient();

    // Exchange the auth code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Redirect to the validated path or fallback to homepage
      return NextResponse.redirect(`${origin}${safeRedirect}`);
    }
  }

  // Redirect to error page if code is missing or exchange fails
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
