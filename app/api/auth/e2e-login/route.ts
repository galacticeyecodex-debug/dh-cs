/**
 * E2E LOGIN API ROUTE
 * ----------------------------------------------------------------------------
 * Server-side API route for E2E test authentication using email/password.
 * This route is ONLY intended for automated testing - it allows programmatic
 * login without going through the OAuth flow.
 *
 * SECURITY:
 * - Only works in non-production environments (NODE_ENV !== 'production')
 * - Requires valid E2E test credentials from environment variables
 * - Does not expose any credentials in responses
 *
 * This route sets the Supabase auth cookies directly in the response,
 * which the browser will store and use for subsequent requests.
 */
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  // Block in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'E2E login is disabled in production' },
      { status: 403 }
    );
  }

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();

    // Create a Supabase server client that can set cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    // Attempt to sign in with email/password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('E2E login error:', error.message);
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    // Return success - cookies are already set by the Supabase client
    return NextResponse.json({
      success: true,
      user: {
        id: data.user?.id,
        email: data.user?.email,
      },
    });
  } catch (error) {
    console.error('E2E login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
