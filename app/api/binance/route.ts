import { NextRequest, NextResponse } from 'next/server';

const BINANCE_API_BASE = 'https://api.binance.com';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const endpoint = searchParams.get('endpoint');

  if (!endpoint) {
    return NextResponse.json({ error: 'Endpoint required' }, { status: 400 });
  }

  // Construct the target URL
  // Remove 'endpoint' from params to forward the rest
  const params = new URLSearchParams(searchParams);
  params.delete('endpoint');

  const url = `${BINANCE_API_BASE}${endpoint}?${params.toString()}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json({ error: `Binance API error: ${res.statusText}` }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
