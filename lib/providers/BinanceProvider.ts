import { OHLCV, MarketDataProvider, GetKlinesParams, UnsubscribeFn, Trade } from "./types";

interface BinanceAggTrade {
  T: number;
  p: string;
  q: string;
  m: boolean;
}

interface BinanceKline {
  0: number; // Open time
  1: string; // Open
  2: string; // High
  3: string; // Low
  4: string; // Close
  5: string; // Volume
}

interface BinanceFilter {
  filterType: string;
  tickSize?: string;
  stepSize?: string;
}

export class BinanceProvider implements MarketDataProvider {
  private ws: WebSocket | null = null;
  private activeSubs: Map<string, UnsubscribeFn> = new Map();

  async getExchangeInfo(symbol: string): Promise<{ tickSize: number; stepSize: number } | null> {
    try {
      const params = new URLSearchParams({
        endpoint: '/api/v3/exchangeInfo',
        symbol: symbol.toUpperCase(),
      });
      const res = await fetch(`/api/binance?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch exchange info');
      const data = await res.json();
      
      const symbolData = data.symbols?.[0];
      if (!symbolData) return null;

      const priceFilter = symbolData.filters.find((f: BinanceFilter) => f.filterType === 'PRICE_FILTER');
      const lotSizeFilter = symbolData.filters.find((f: BinanceFilter) => f.filterType === 'LOT_SIZE');

      return {
        tickSize: priceFilter ? parseFloat(priceFilter.tickSize) : 0.01,
        stepSize: lotSizeFilter ? parseFloat(lotSizeFilter.stepSize) : 0.001
      };
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  async getTrades(symbol: string, from: number, to: number): Promise<Trade[]> {
    return this.getAggTrades(symbol, from * 1000, to * 1000);
  }

  async getAggTrades(symbol: string, fromMs: number, toMs: number): Promise<Trade[]> {
    let allTrades: Trade[] = [];
    let currentStartTime = fromMs;
    const endTime = toMs;
    const MAX_TRADES = 100000; 
    // Note: 100k trades is still limited for high timeframe high volume, but better than 10k.
    
    let loopCount = 0;
    const MAX_LOOPS = 50; // Safety break after 50 requests (~50k-100k trades depending on batch size)

    try {
      while (true) {
        loopCount++;
        if (loopCount > MAX_LOOPS) {
            console.warn(`BinanceProvider: Max loops (${MAX_LOOPS}) reached for getAggTrades. Returning partial data.`);
            break;
        }

        const params = new URLSearchParams({
          endpoint: '/api/v3/aggTrades',
          symbol: symbol.toUpperCase(),
          limit: '1000',
          startTime: currentStartTime.toString(),
          endTime: endTime.toString()
        });

        const res = await fetch(`/api/binance?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch trades');

        const rawData = await res.json();
        if (!Array.isArray(rawData) || rawData.length === 0) break;

        const trades = rawData.map((t: BinanceAggTrade) => ({
          time: t.T,
          price: parseFloat(t.p),
          qty: parseFloat(t.q),
          isBuyerMaker: t.m,
        }));

        allTrades = [...allTrades, ...trades];

        // Stop if we have enough data or reached the end
        if (trades.length < 1000 || allTrades.length >= MAX_TRADES) break;

        // Next batch starts after the last trade
        currentStartTime = trades[trades.length - 1].time + 1;
        
        // Safety check if we passed endTime
        if (currentStartTime >= endTime) break;
      }

      return allTrades;
    } catch (e) {
      console.error(e);
      return allTrades; // Return what we have
    }
  }

  async getKlines({ symbol, interval, from, to, limit = 1000 }: GetKlinesParams): Promise<OHLCV[]> {
    // Convert generic intervals (1h, 4h) to Binance format if needed
    // Binance uses 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w, 1M
    // Our app uses: 1m, 5m, 15m, 1h, 4h, D (1d), W (1w)
    const binanceInterval = this.mapInterval(interval);
    
    // Use our internal proxy to avoid CORS
    const params = new URLSearchParams({
      endpoint: '/api/v3/klines',
      symbol: symbol.toUpperCase(),
      interval: binanceInterval,
      limit: limit.toString(),
    });

    if (from) params.append('startTime', (from * 1000).toString());
    if (to) params.append('endTime', (to * 1000).toString());

    try {
      const res = await fetch(`/api/binance?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch klines');
      
      const rawData = await res.json();
      
      if (!Array.isArray(rawData)) return [];

      return rawData.map((k: (number | string)[]) => ({
        time: (k[0] as number) / 1000, // Binance gives ms, Lightweight Charts wants seconds
        open: parseFloat(k[1] as string),
        high: parseFloat(k[2] as string),
        low: parseFloat(k[3] as string),
        close: parseFloat(k[4] as string),
        volume: parseFloat(k[5] as string),
      }));
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  subscribe(params: { symbol: string; interval: string }, onUpdate: (candle: OHLCV) => void): UnsubscribeFn {
    const symbol = params.symbol.toLowerCase();
    const interval = this.mapInterval(params.interval);
    const streamName = `${symbol}@kline_${interval}`;
    
    // Close existing connection if any (simple implementation: one connection per app instance ideally, 
    // but here we can just create a new one or manage a singleton. 
    // For MVP, a new connection per sub is okay but inefficient. 
    // Better: Single connection with multiplexing.
    
    // Let's do a robust singleton-ish approach for this MVP instance
    if (this.ws) {
      // If we already have a WS, we might want to send a SUBSCRIBE message
      // But simpler for this MVP: Just close and reconnect with new stream or add to URL?
      // Binance allows combined streams: /stream?streams=<streamName1>/<streamName2>
      // For now, let's assume one active chart = one active subscription.
      this.ws.close();
    }

    this.ws = new WebSocket(`wss://stream.binance.com:9443/ws/${streamName}`);

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.e === 'kline') {
        const k = data.k;
        const candle: OHLCV = {
          time: k.t / 1000,
          open: parseFloat(k.o),
          high: parseFloat(k.h),
          low: parseFloat(k.l),
          close: parseFloat(k.c),
          volume: parseFloat(k.v),
        };
        onUpdate(candle);
      }
    };

    return () => {
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
    };
  }

  private mapInterval(interval: string): string {
    const map: Record<string, string> = {
      '1m': '1m',
      '5m': '5m',
      '15m': '15m',
      '1h': '1h',
      '4h': '4h',
      'D': '1d',
      'W': '1w',
    };
    return map[interval] || '1h';
  }
}

export const binanceProvider = new BinanceProvider();
