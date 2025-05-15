// import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// For testing purposes, we're disabling authentication checks
export async function middleware(req: NextRequest) {
  // Simply return the next response without authentication checks for testing
  return NextResponse.next();

  // In production, you would use the following code:
  /*
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Check if the user is trying to access protected routes
  const isProtectedRoute = req.nextUrl.pathname.startsWith('/dashboard') ||
                          req.nextUrl.pathname.startsWith('/results');

  // If accessing a protected route without a session, redirect to auth page
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/auth', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  // If accessing auth page with a session, redirect to dashboard
  if (req.nextUrl.pathname === '/auth' && session) {
    const redirectUrl = new URL('/dashboard', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  return res;
  */
}

export const config = {
  matcher: ['/dashboard/:path*', '/results/:path*', '/auth'],
};
