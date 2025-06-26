import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body;
    
    if (!token) {
      return NextResponse.json(
        { status: 'error', message: 'Verification token is required' },
        { status: 400 }
      );
    }
    
    // Forward the request to our backend server
    const response = await fetch(`https://www.novia-ai.com/api/auth/verify-email/${token}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    
    // Return the response with the same status
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { status: 'error', message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
