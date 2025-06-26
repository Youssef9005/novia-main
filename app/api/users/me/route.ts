import { NextRequest, NextResponse } from 'next/server';

// GET user profile
export async function GET(req: NextRequest) {
  try {
    // Get the JWT token from the request headers
    const token = req.headers.get('Authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json(
        { status: 'error', message: 'Authentication token is required' },
        { status: 401 }
      );
    }
    
    // Forward the request to our backend server
    const response = await fetch('https://api.novia-ai.com/api/users/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    // Return the response with the same status
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Get user profile error:', error);
    return NextResponse.json(
      { status: 'error', message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update user profile
export async function PATCH(req: NextRequest) {
  try {
    // Get the JWT token from the request headers
    const token = req.headers.get('Authorization')?.split(' ')[1];
    const body = await req.json();
    
    if (!token) {
      return NextResponse.json(
        { status: 'error', message: 'Authentication token is required' },
        { status: 401 }
      );
    }
    
    // Forward the request to our backend server
    const response = await fetch('https://api.novia-ai.com/api/users/me', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    
    // Return the response with the same status
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Update user profile error:', error);
    return NextResponse.json(
      { status: 'error', message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
