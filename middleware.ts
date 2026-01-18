/**
 * NEXT.JS MIDDLEWARE
 * ----------------------------------------------------------------------------
 * This middleware functions as the global gatekeeper for the application's secure routes.
 *
 * FUNCTIONALITY:
 * - Intercepts requests to specific protected paths (defined in the `config.matcher`).
 * - Manages Supabase session refreshes, ensuring the user's auth token is valid and
 *   updated (refreshing access tokens if they have expired).
 * - Acts as an entry point for server-side authentication logic, delegating the actual
 *   session handling to the helper in `@/lib/supabase/middleware`.
 * - Essential for maintaining persistent user sessions and securing private pages
 *   like profiles and character creation.
 */

import { type NextRequest } from "next/server";

import updateSession from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: ["/profile", "/settings", "/login", "/client/:path*", "/create-character"],
};
