
export interface Candle {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
}

export function calculateSMA(data: Candle[], period: number): { time: number; value: number }[] {
    const sma = [];
    for (let i = period - 1; i < data.length; i++) {
        const sum = data.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val.close, 0);
        sma.push({
            time: data[i].time,
            value: sum / period
        });
    }
    return sma;
}

export function calculateEMA(data: Candle[], period: number): { time: number; value: number }[] {
    const k = 2 / (period + 1);
    const ema = [];
    
    // Start with SMA for the first EMA value
    let initialSum = 0;
    for (let i = 0; i < period; i++) {
        initialSum += data[i].close;
    }
    let prevEma = initialSum / period;
    
    ema.push({ time: data[period - 1].time, value: prevEma });

    for (let i = period; i < data.length; i++) {
        const currentEma = (data[i].close - prevEma) * k + prevEma;
        ema.push({ time: data[i].time, value: currentEma });
        prevEma = currentEma;
    }
    
    return ema;
}

export function calculateRSI(data: Candle[], period: number = 14): { time: number; value: number }[] {
    if (data.length <= period) return [];

    const rsi = [];
    let gains = 0;
    let losses = 0;

    // Calculate initial average gain/loss
    for (let i = 1; i <= period; i++) {
        const diff = data[i].close - data[i - 1].close;
        if (diff >= 0) gains += diff;
        else losses += Math.abs(diff);
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    const firstRS = avgGain / avgLoss;
    const firstRSI = 100 - (100 / (1 + firstRS));
    
    rsi.push({ time: data[period].time, value: firstRSI });

    // Calculate subsequent values
    for (let i = period + 1; i < data.length; i++) {
        const diff = data[i].close - data[i - 1].close;
        const gain = diff >= 0 ? diff : 0;
        const loss = diff < 0 ? Math.abs(diff) : 0;

        avgGain = ((avgGain * (period - 1)) + gain) / period;
        avgLoss = ((avgLoss * (period - 1)) + loss) / period;

        const rs = avgGain / avgLoss;
        const currentRSI = 100 - (100 / (1 + rs));

        rsi.push({ time: data[i].time, value: currentRSI });
    }

    return rsi;
}
