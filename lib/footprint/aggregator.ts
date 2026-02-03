import { OHLCV, Trade } from '../providers/types';

export interface FootprintLevel {
  price: number;
  bidVol: number;
  askVol: number;
  delta: number;
  total: number;
  imbalance: 'bid' | 'ask' | null;
}

export interface FootprintCandle extends OHLCV {
  levels: FootprintLevel[];
  delta: number;
  totalVolume: number;
  maxVolLevel: number; // Price level with max volume
}

export function aggregateTrades(
  candles: OHLCV[], 
  trades: Trade[], 
  priceStep: number,
  imbalanceRatio: number = 3.0
): FootprintCandle[] {
  if (!candles.length || !trades.length) return [];

  // Sort trades by time just in case
  const sortedTrades = [...trades].sort((a, b) => a.time - b.time);
  
  // Sort candles
  const sortedCandles = [...candles].sort((a, b) => a.time - b.time);

  // Helper to round price to nearest step
  const getLevel = (price: number) => {
    if (!priceStep) return price;
    return Math.round(price / priceStep) * priceStep;
  };

  let tradeIdx = 0;

  return sortedCandles.map((candle, i) => {
    const startTime = candle.time * 1000;
    // Determine end time. If it's the last candle, we might not know duration easily 
    // without timeframe info, but usually we can infer from next candle or assume standard.
    // For safety, let's use next candle start time or infinite for last one (up to a reasonable limit)
    // But actually, we should pass timeframe or duration. 
    // Let's assume uniform duration from previous candles if possible.
    
    let endTime: number;
    if (i < sortedCandles.length - 1) {
      endTime = sortedCandles[i + 1].time * 1000;
    } else {
      // Estimate duration from previous
      const duration = i > 0 ? (candle.time - sortedCandles[i-1].time) * 1000 : 60000; // Default 1m
      endTime = startTime + duration;
    }

    const levelsMap = new Map<number, { bid: number; ask: number }>();

    // Process trades for this candle
    while (tradeIdx < sortedTrades.length) {
      const trade = sortedTrades[tradeIdx];
      
      if (trade.time < startTime) {
        tradeIdx++;
        continue;
      }
      
      if (trade.time >= endTime) {
        break; // Belongs to next candle
      }

      const levelPrice = getLevel(trade.price);
      const current = levelsMap.get(levelPrice) || { bid: 0, ask: 0 };

      // isBuyerMaker = true => Aggressive Sell (Bid side)
      // isBuyerMaker = false => Aggressive Buy (Ask side)
      if (trade.isBuyerMaker) {
        current.bid += trade.qty;
      } else {
        current.ask += trade.qty;
      }
      
      levelsMap.set(levelPrice, current);
      tradeIdx++;
    }

    // Convert map to array and calculate imbalances
    const levels: FootprintLevel[] = [];
    let candleDelta = 0;
    let candleTotalVol = 0;
    let maxVol = 0;
    let maxVolLevel = 0;

    levelsMap.forEach((val, price) => {
      const total = val.bid + val.ask;
      const delta = val.ask - val.bid;
      
      candleTotalVol += total;
      candleDelta += delta;

      if (total > maxVol) {
        maxVol = total;
        maxVolLevel = price;
      }

      levels.push({
        price,
        bidVol: val.bid,
        askVol: val.ask,
        delta,
        total,
        imbalance: null // Calc below
      });
    });

    // Sort levels by price ascending
    levels.sort((a, b) => a.price - b.price);

    // Calculate Imbalances
    // Bid imbalance: Bid at price X > Ask at price X+1 * ratio
    // Ask imbalance: Ask at price X > Bid at price X-1 * ratio
    // Note: X+1 index in sorted array is higher price.
    // Standard footprint diagonal comparison:
    // Ask at Level i vs Bid at Level i+1 (diagonal up) ? No, usually diagonal.
    // Let's use the prompt's definition:
    // "if ask(level) >= bid(adjacent)*ratio" -> which adjacent? 
    // Standard order flow is diagonal: 
    // Ask at Price P is compared to Bid at Price P-tick (since market moves up/down).
    // Prompt says: "ask(level) >= bid(adjacent)*ratio".
    // Usually: Aggressive Buy lifting the offer (Ask) at P is compared to Aggressive Sell hitting the bid (Bid) at P-tick.
    // Let's implement diagonal logic:
    // Ask Imbalance: Ask[i] > Bid[i-1] * ratio (Ask at current > Bid at lower) ?? 
    // Wait. Ask is at Higher price. Bid is at Lower price.
    // When price moves up (Ask side), we compare Ask[i] with Bid[i-1] (tick below)?
    // Or Ask[i] vs Bid[i+1]?
    // Let's assume standard: Diagonal Up (Ask vs Bid below) and Diagonal Down (Bid vs Ask above).
    
    // Actually, simply:
    // Ask Imbalance: Ask[i] >= Bid[i-1] * ratio
    // Bid Imbalance: Bid[i] >= Ask[i+1] * ratio
    
    for (let j = 0; j < levels.length; j++) {
      const current = levels[j];
      
      // Check Ask Imbalance (Diagonal comparison with Bid below)
      // We need levels to be contiguous for strict tick comparison? 
      // Or just next available level? Footprint charts usually compare strictly adjacent ticks.
      // But if we have gaps, we might compare with next available. Let's use next available in array for now.
      
      // Ask Imbalance
      if (j > 0) {
        const bidBelow = levels[j - 1].bidVol;
        // Handle 0 denominator: if bidBelow is 0, any askVol > 0 is technically infinite ratio.
        // We can check if askVol is significantly large? Or just strictly follow ratio.
        // Let's allow if bidBelow is 0 and askVol > 0, or if ratio met.
        // But to avoid noise with 1 vs 0, maybe we require askVol > 0.
        if (current.askVol > 0 && (bidBelow === 0 || current.askVol >= bidBelow * imbalanceRatio)) {
           current.imbalance = 'ask';
        }
      }
      
      // Bid Imbalance (Diagonal comparison with Ask above)
      if (j < levels.length - 1) {
        const askAbove = levels[j + 1].askVol;
        if (current.bidVol > 0 && (askAbove === 0 || current.bidVol >= askAbove * imbalanceRatio)) {
          // If it already has ask imbalance, what do? rare.
          // Prioritize largest or show mixed? 
          // Let's just overwrite or keep 'bid'.
          if (current.imbalance === 'ask') {
             // both? 
          } else {
             current.imbalance = 'bid';
          }
        }
      }
    }

    return {
      ...candle,
      levels,
      delta: candleDelta,
      totalVolume: candleTotalVol,
      maxVolLevel
    };
  });
}
