import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password, passwordConfirm } = body;
    
    if (!token || !password || !passwordConfirm) {
      return NextResponse.json(
        { status: 'error', message: 'Token, password and password confirmation are required' },
        { status: 400 }
      );
    }
    
    console.log('Reset password request with token:', token);
    
    // Make sure the token is properly encoded for the URL
    const encodedToken = encodeURIComponent(token);
    
    // Forward the request to our backend server with the token in the URL as expected by the backend
    const response = await fetch(`http://localhost:8080/api/auth/reset-password/${encodedToken}`, {
      method: 'PATCH', // The backend expects a PATCH request
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password, passwordConfirm }),
    });
    
    const data = await response.json();
    
    // Return the response with the same status
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { status: 'error', message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
