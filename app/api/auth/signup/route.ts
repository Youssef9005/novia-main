import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Forward the request to our backend server
    const response = await fetch('http://localhost:8080/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    
    // Return the response with the same status
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Signup error:', error);
    
    // Handle specific error cases
    if (error.code === 'ECONNREFUSED') {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Unable to connect to the server. Please try again later.' 
        },
        { status: 503 }
      );
    }
    
    if (error.name === 'FetchError') {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Network error. Please check your connection and try again.' 
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { 
        status: 'error', 
        message: error.message || 'An unexpected error occurred. Please try again.' 
      },
      { status: 500 }
    );
  }
}
