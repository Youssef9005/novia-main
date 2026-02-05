
export interface HTFProfileLevel {
    price: number;
    volume: number;
    bid: number;
    ask: number;
}

export interface HTFCandle {
    time: number; // Start time of the HTF candle (Unix seconds)
    endTime: number; // End time (Unix seconds)
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    levels: HTFProfileLevel[];
    pocPrice: number; // Price with max volume
    valueAreaHigh?: number;
    valueAreaLow?: number;
}

export interface HTFSettings {
    enabled: boolean;
    timeframe: 'Auto' | '1H' | '4H' | '1D'; 
    showOutline: boolean;
    showProfile: boolean;
    showPOC: boolean;
    showValueArea: boolean;
    widthPercentage: number; // 0-100
    align: 'left' | 'right';
    colorScheme: {
        outlineUp: string;
        outlineDown: string;
        profileUp: string;
        profileDown: string;
        poc: string;
        val?: string;
        vah?: string;
        background: string;
    };
}
