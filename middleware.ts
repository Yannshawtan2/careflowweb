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
    // Get token from cookies
    const userRole = request.cookies.get('userRole')?.value
    
    if (!userRole) {
      console.log('No user role found in cookies, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Check if user's role has access to this route
    const allowedRoles = protectedRoutes[path as keyof typeof protectedRoutes]
    if (!allowedRoles.includes(userRole)) {
      // Redirect to appropriate dashboard based on role
      switch (userRole) {
        case 'admin':
          return NextResponse.redirect(new URL('/admindashboard', request.url))
        case 'staff':
          return NextResponse.redirect(new URL('/staffdashboard', request.url))
        case 'guardian':
          return NextResponse.redirect(new URL('/guardian-dashboard', request.url))
        default:
          return NextResponse.redirect(new URL('/login', request.url))
      }
    }
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