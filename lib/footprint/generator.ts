
import { FootprintCandle, FootprintLevel } from '@/types/footprintTypes';

interface MinimalCandle {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
}

/**
 * Generates a mock FootprintCandle from standard OHLCV data.
 * Ensures strict synchronization with the source candle's High, Low, and Volume.
 */
export const generateFootprintCandle = (candle: MinimalCandle): FootprintCandle => {
    const { open, high, low, close } = candle;
    const volume = candle.volume || Math.floor(Math.random() * 1000) + 100;
    
    // 1. Determine Tick Size (Price Step)
    // We want a reasonable number of rows (e.g., 10-50).
    const range = high - low;
    let tickSize = 0.1;
    
    // Adaptive tick size logic
    // We want to ensure cells are tall enough for text (at least 14-20px ideally)
    if (range < 0.1) tickSize = 0.005;
    else if (range < 1) tickSize = 0.05;
    else if (range < 10) tickSize = 0.5;
    else if (range < 100) tickSize = 2.0;
    else if (range < 1000) tickSize = 10.0;
    else tickSize = 25.0;

    // Safety & Visibility: ensure we don't have too many levels
    // Cap at ~12 levels per candle to ensure text visibility (larger cells)
    if (range / tickSize > 12) {
        tickSize = range / 12;
    }

    // 2. Create Levels
    const levels: FootprintLevel[] = [];
    
    // We iterate from Low to High
    // Fix floating point issues by working with integers then scaling back? 
    // Or just use epsilon.
    const startPrice = Math.floor(low / tickSize) * tickSize;
    const endPrice = Math.ceil(high / tickSize) * tickSize;
    
    // Count expected levels
    let stepCount = Math.floor((endPrice - startPrice) / tickSize) + 1;
    if (stepCount < 1) stepCount = 1;

    // 3. Distribute Volume
    // We use a simplified distribution where volume is higher near the 'close' or 'mode' of the candle
    // but for now, random distribution summing to Total is sufficient for visual sync.
    
    const rawWeights = new Array(stepCount).fill(0).map((_, i) => {
        const p = startPrice + (i * tickSize);
        // Weight higher if near Open or Close
        const distOpen = Math.abs(p - open);
        const distClose = Math.abs(p - close);
        const minDst = Math.min(distOpen, distClose);
        // Inverse distance weight + random noise
        return (1 / (minDst + tickSize)) * Math.random();
    });
    
    const totalWeight = rawWeights.reduce((a, b) => a + b, 0);
    
    let calculatedTotalVol = 0;

    for (let i = 0; i < stepCount; i++) {
        const price = Number((startPrice + (i * tickSize)).toFixed(4));
        
        // Don't generate levels outside strict High/Low (unless it's the single level case)
        if (price < low && i > 0) continue;
        if (price > high && i < stepCount - 1) continue;

        let levelVol = Math.floor((rawWeights[i] / totalWeight) * volume);
        if (levelVol < 0) levelVol = 0;

        // Determine Bid/Ask split
        // Randomly bias based on candle direction
        const isBullish = close > open;
        const bias = isBullish ? 0.6 : 0.4; // Slight bias
        
        const ask = Math.floor(levelVol * (Math.random() * 0.4 + bias)); // Bias towards Ask if bullish
        const bid = levelVol - ask;
        
        // Imbalance Detection (Mock)
        // If one side is significantly larger, mark it
        let imbalance: 'bid' | 'ask' | 'none' = 'none';
        if (ask > bid * 3 && ask > 50) imbalance = 'ask';
        if (bid > ask * 3 && bid > 50) imbalance = 'bid';

        levels.push({
            price,
            bid,
            ask,
            volume: levelVol,
            delta: ask - bid,
            imbalance
        });
        
        calculatedTotalVol += levelVol;
    }

    // 4. Reconciliation
    // Ensure total volume matches exactly by adjusting the level with highest volume
    const volDiff = volume - calculatedTotalVol;
    if (volDiff !== 0 && levels.length > 0) {
        // Find index of max volume level
        let maxIdx = 0;
        let maxVol = -1;
        levels.forEach((l, i) => {
            if (l.volume > maxVol) {
                maxVol = l.volume;
                maxIdx = i;
            }
        });
        
        levels[maxIdx].volume += volDiff;
        if (volDiff > 0) {
            levels[maxIdx].ask += volDiff; // Add to ask
        } else {
            // Remove from whichever is larger to avoid negatives
            if (levels[maxIdx].ask > Math.abs(volDiff)) levels[maxIdx].ask += volDiff;
            else levels[maxIdx].bid += volDiff;
        }
        
        // Re-calc delta for this level
        levels[maxIdx].delta = levels[maxIdx].ask - levels[maxIdx].bid;
    }

    // 5. Calculate Candle Delta
    const candleDelta = levels.reduce((sum, l) => sum + l.delta, 0);

    return {
        time: candle.time,
        open, high, low, close,
        volume,
        levels,
        delta: candleDelta,
        cumulativeDelta: 0 // To be filled by aggregator
    };
};
