import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Fetch real gold price (XAUUSD) from GoldPrice.org (Reliable Spot Price)
    const response = await fetch('https://data-asg.goldprice.org/dbXRates/USD', {
      headers: {
        'User-Agent': 'Mozilla/5.0', // Mimic browser to avoid blocking
        'Accept': 'application/json'
      },
      next: { revalidate: 0 } // Ensure fresh data
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch gold price');
    }

    const data = await response.json();
    // Data format: { items: [ { curr: "USD", xauPrice: 2650.50, ... } ] }
    const realPrice = data?.items?.[0]?.xauPrice;

    if (!realPrice) {
      throw new Error('Invalid price data');
    }

    return NextResponse.json({ price: realPrice });
  } catch (error) {
    console.error('Error fetching gold price:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market price' }, 
      { status: 500 }
    );
  }
}
