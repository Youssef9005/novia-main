
import { FootprintCandle, FootprintLevel } from '@/types/footprintTypes';
import { HTFCandle, HTFProfileLevel } from '@/types/htfTypes';

/**
 * Aggregates lower timeframe FootprintCandles into Higher Timeframe (HTF) Candles with Volume Profiles.
 * 
 * @param candles Source candles (lower timeframe)
 * @param timeframeInMinutes Duration of the HTF candle in minutes (e.g., 60, 240)
 */
export const aggregateToHTF = (candles: FootprintCandle[], timeframeInMinutes: number): HTFCandle[] => {
    if (!candles || candles.length === 0) return [];

    const htfCandles: HTFCandle[] = [];
    const timeframeSeconds = timeframeInMinutes * 60;

    // Helper to get HTF start time
    const getHTFStartTime = (time: number) => {
        return Math.floor(time / timeframeSeconds) * timeframeSeconds;
    };

    let currentHTF: HTFCandle | null = null;

    // Map to aggregate volume at price levels
    let levelMap = new Map<number, HTFProfileLevel>();

    candles.forEach((candle) => {
        const htfStartTime = getHTFStartTime(candle.time);

        // If new HTF period starts
        if (!currentHTF || htfStartTime !== currentHTF.time) {
            // Push previous HTF
            if (currentHTF) {
                finalizeHTF(currentHTF, levelMap);
                htfCandles.push(currentHTF);
            }

            // Init new HTF
            currentHTF = {
                time: htfStartTime,
                endTime: htfStartTime + timeframeSeconds,
                open: candle.open,
                high: candle.high,
                low: candle.low,
                close: candle.close,
                volume: 0,
                levels: [],
                pocPrice: 0
            };
            levelMap = new Map();
        }

        // Update HTF stats
        if (currentHTF) {
            currentHTF.high = Math.max(currentHTF.high, candle.high);
            currentHTF.low = Math.min(currentHTF.low, candle.low);
            currentHTF.close = candle.close;
            currentHTF.volume += candle.volume;

            // Merge Levels
            candle.levels.forEach(lvl => {
                const existing = levelMap.get(lvl.price);
                if (existing) {
                    existing.volume += lvl.volume;
                    existing.bid += lvl.bid;
                    existing.ask += lvl.ask;
                } else {
                    levelMap.set(lvl.price, {
                        price: lvl.price,
                        volume: lvl.volume,
                        bid: lvl.bid,
                        ask: lvl.ask
                    });
                }
            });
        }
    });

    // Push the last one
    if (currentHTF) {
        finalizeHTF(currentHTF, levelMap);
        htfCandles.push(currentHTF);
    }

    return htfCandles;
};

const finalizeHTF = (htf: HTFCandle, map: Map<number, HTFProfileLevel>) => {
    // Convert map to array
    const levels = Array.from(map.values()).sort((a, b) => a.price - b.price);
    htf.levels = levels;

    // Find POC
    let maxVol = -1;
    let pocPrice = 0;
    levels.forEach(l => {
        if (l.volume > maxVol) {
            maxVol = l.volume;
            pocPrice = l.price;
        }
    });
    htf.pocPrice = pocPrice;
    
    // Calculate Value Area (Simple 70% approximation) - Optional, for now just POC is enough for visual
};
