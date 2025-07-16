import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define protected routes and their allowed roles
const protectedRoutes = {
  '/admindashboard': ['admin'],
  '/staffdashboard': ['staff', 'admin'],
  '/guardian-dashboard': ['guardian']
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Check if the current path is a protected route
  if (path in protectedRoutes) {
    // Check for session cookie
    const sessionCookie = request.cookies.get('session')?.value;
    
    if (!sessionCookie) {
      console.log('No session cookie found, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // If we have a session cookie, let the request proceed
    // The actual validation will be done in the layout components
    return NextResponse.next()
  }

  return NextResponse.next()
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    '/admindashboard/:path*',
    '/staffdashboard/:path*',
    '/guardian-dashboard/:path*'
  ]
} 