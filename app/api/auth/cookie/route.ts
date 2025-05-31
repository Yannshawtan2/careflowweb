import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { role } = await request.json();
    
    if (!role) {
      return NextResponse.json({ error: 'Role is required' }, { status: 400 });
    }
    
    const response = NextResponse.json({ success: true });
    
    // Set cookie that middleware can access
    response.cookies.set({
      name: 'userRole',
      value: role,
      path: '/',
      maxAge: 60 * 60 * 24, // 1 day
      httpOnly: false,
    });
    
    return response;
  } catch (error) {
    console.error('Error setting cookie:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 