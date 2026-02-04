import {
    ISeriesPrimitive,
    IPrimitivePaneRenderer,
    IPrimitivePaneView,
    ISeriesApi,
    SeriesOptionsMap,
    Time,
    IChartApi,
    PrimitivePaneViewZOrder,
} from 'lightweight-charts';
import { FootprintCandle, FootprintSettings } from '@/types/footprintTypes';

interface CanvasRenderingTarget2D {
    useMediaCoordinateSpace: (callback: (scope: { context: CanvasRenderingContext2D, mediaSize: { width: number, height: number } }) => void) => void;
}

// Helper for volume formatting (K/M)
const formatVolume = (num: number): string => {
    if (num === 0) return '0';
    if (Math.abs(num) >= 1_000_000) {
        return (num / 1_000_000).toFixed(3) + ' M';
    }
    if (Math.abs(num) >= 1_000) {
        return (num / 1_000).toFixed(3) + ' K';
    }
    return num.toString();
};

class FootprintRenderer implements IPrimitivePaneRenderer {
    _data: FootprintCandle[] = [];
    _settings: FootprintSettings;
    _chart: IChartApi;
    _series: ISeriesApi<keyof SeriesOptionsMap>;

    constructor(chart: IChartApi, series: ISeriesApi<keyof SeriesOptionsMap>, settings: FootprintSettings) {
        this._chart = chart;
        this._series = series;
        this._settings = {
            ...settings,
            colorScheme: settings.colorScheme || {
                buy: '#B2DFDB',
                sell: '#FFCDD2',
                imbalanceBuy: '#00897B',
                imbalanceSell: '#E53935',
                text: '#000000',
                background: 'transparent'
            }
        };
    }

    update(data: FootprintCandle[], settings: FootprintSettings) {
        this._data = data;
        // Ensure colorScheme exists with defaults to prevent runtime errors
        this._settings = {
            ...settings,
            colorScheme: settings.colorScheme || {
                buy: '#B2DFDB', 
                sell: '#FFCDD2', 
                imbalanceBuy: '#00897B', 
                imbalanceSell: '#E53935', 
                text: '#000000', 
                background: 'transparent'
            }
        };
    }

    draw(target: CanvasRenderingTarget2D) {
        target.useMediaCoordinateSpace(({ context: ctx, mediaSize }: { context: CanvasRenderingContext2D, mediaSize: { width: number, height: number } }) => {
            if (!this._data || this._data.length === 0 || !this._settings.enabled) return;

            const timeScale = this._chart.timeScale();
            // Check if we have visible range
            if (timeScale.getVisibleLogicalRange() === null) return;

            // Ensure settings and color scheme are fully populated
            const colorScheme = this._settings.colorScheme || {};
            const colors = {
                buy: colorScheme.buy || '#B2DFDB',
                sell: colorScheme.sell || '#FFCDD2',
                imbalanceBuy: colorScheme.imbalanceBuy || '#00897B',
                imbalanceSell: colorScheme.imbalanceSell || '#E53935',
                text: colorScheme.text || '#000000',
                background: colorScheme.background || 'transparent'
            };

            ctx.save();
            ctx.font = `${this._settings.fontSize}px sans-serif`; // e.g. "10px sans-serif"
            ctx.textBaseline = 'middle';

            // Constants
            const barSpacing = timeScale.options().barSpacing;
            // The total width available for the footprint columns
            const barWidth = Math.max(1, barSpacing * 0.95); 
            const gap = 2; // Gap between Bid and Ask columns
            const columnWidth = (barWidth - gap) / 2;

            // Visibility checks
            // Show text if we have enough space. 
            // Force text to show even if tight, unless disabled by user
            const showText = this._settings.showText !== false; // Default to true if undefined

            this._data.forEach(candle => {
                const x = timeScale.timeToCoordinate(candle.time as Time);
                // Visibility check
                if (x === null || x < -barWidth || x > mediaSize.width + barWidth) return;

                // 1. Calculate Tick Size (Row Height)
                let tickSize = 0.1;
                if (candle.levels.length > 1) {
                    tickSize = Math.abs(candle.levels[1].price - candle.levels[0].price);
                }

                // 2. Identify Point of Control (POC) - Level with Max Volume
                let maxVol = 0;
                let pocIndex = -1;
                candle.levels.forEach((lvl, idx) => {
                    if (lvl.volume > maxVol) {
                        maxVol = lvl.volume;
                        pocIndex = idx;
                    }
                });

                // 3. Draw Levels
                candle.levels.forEach((level, index) => {
                    const y = this._series.priceToCoordinate(level.price);
                    if (y === null) return;

                    // Calculate cell height
                    const nextPriceY = this._series.priceToCoordinate(level.price + tickSize);
                    let cellHeight = 14; 
                    if (nextPriceY !== null) {
                        cellHeight = Math.abs(y - nextPriceY);
                    }
                    
                    // Min height constraint for visibility
                    const minVisibleHeight = 2;
                    if (cellHeight < minVisibleHeight) cellHeight = minVisibleHeight;

                    // Text visibility threshold based on height
                    const textFitsHeight = cellHeight >= 10;
                    const effectiveShowText = showText && textFitsHeight;

                    // Coordinates
                    const topY = y - cellHeight / 2;
                    // const bottomY = y + cellHeight / 2;

                    // --- Left (Bid/Sell) ---
                    const xLeft = x - (gap / 2) - columnWidth;
                    
                    // Color Logic for Bid
                    let bidBg = colors.sell; 
                    let bidText = colors.text;

                    // Imbalance (Stronger Red)
                    if (level.imbalance === 'bid') {
                        bidBg = colors.imbalanceSell;
                        bidText = '#FFFFFF'; // White text on dark bg
                    }
                    // POC (Black) - Overrides imbalance color for background usually, or just highlights
                    if (index === pocIndex) {
                        // In some charts POC is a border, in the image provided some cells are black. 
                        // Let's assume black cell = POC or very high volume.
                        // We'll treat POC as Black background.
                        bidBg = '#000000';
                        bidText = '#FFFFFF';
                    }

                    ctx.fillStyle = bidBg;
                    // Add a tiny padding between rows (0.5px)
                    ctx.fillRect(xLeft, topY + 0.5, columnWidth, cellHeight - 1);

                    if (effectiveShowText) {
                        ctx.fillStyle = bidText;
                        ctx.textAlign = 'center';
                        ctx.font = `500 ${this._settings.fontSize}px sans-serif`; // Bold-ish
                        // Always draw if showText is true
                        ctx.fillText(formatVolume(level.bid), xLeft + columnWidth / 2, y);
                    }

                    // --- Right (Ask/Buy) ---
                    const xRight = x + (gap / 2);

                    // Color Logic for Ask
                    let askBg = colors.buy; 
                    let askText = colors.text; 

                    // Imbalance (Stronger Teal)
                    if (level.imbalance === 'ask') {
                        askBg = colors.imbalanceBuy;
                        askText = '#FFFFFF';
                    }
                    // POC (Black)
                    if (index === pocIndex) {
                        askBg = '#000000';
                        askText = '#FFFFFF';
                    }

                    ctx.fillStyle = askBg;
                    ctx.fillRect(xRight, topY + 0.5, columnWidth, cellHeight - 1);

                    if (effectiveShowText) {
                        ctx.fillStyle = askText;
                        ctx.textAlign = 'center';
                        ctx.font = `500 ${this._settings.fontSize}px sans-serif`;
                        // Always draw if showText is true
                        ctx.fillText(formatVolume(level.ask), xRight + columnWidth / 2, y);
                    }
                });

                // 4. Draw Delta Summary Box
                if (this._settings.showDeltaSummary) {
                    const yLow = this._series.priceToCoordinate(candle.low);
                    if (yLow !== null) {
                        const boxY = yLow + 20; 
                        const boxWidth = Math.max(80, barWidth * 1.2); // Min width or proportional
                        const boxHeight = 36;
                        const boxX = x - boxWidth / 2;

                        // Only draw if we have enough horizontal space or if it's the hovered candle (not handled here yet)
                        // Lower threshold to ensure it shows up more often
                        if (barSpacing > 40) {
                            // Draw Shadow/Border
                            ctx.shadowColor = 'rgba(0,0,0,0.1)';
                            ctx.shadowBlur = 4;
                            ctx.shadowOffsetY = 2;
                            
                            ctx.fillStyle = '#FFFFFF';
                            ctx.beginPath();
                            ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 4);
                            ctx.fill();
                            
                            ctx.shadowColor = 'transparent'; // Reset shadow

                            // Text
                            ctx.textAlign = 'center';
                            
                            // Delta Line
                            ctx.font = '600 10px sans-serif';
                            ctx.fillStyle = candle.delta > 0 ? '#00897B' : '#E53935'; // Strong Teal or Red
                            ctx.fillText(`Delta  ${formatVolume(candle.delta)}`, x, boxY + 12);

                            // Total Line
                            ctx.fillStyle = '#000000';
                            ctx.font = '600 10px sans-serif';
                            ctx.fillText(`Total  ${formatVolume(candle.volume)}`, x, boxY + 26);
                        }
                    }
                }
            });

            ctx.restore();
        });
    }
}

export class FootprintSeries implements ISeriesPrimitive {
    _chart: IChartApi;
    _series: ISeriesApi<keyof SeriesOptionsMap>;
    _settings: FootprintSettings;
    _data: FootprintCandle[] = [];
    _paneViews: IPrimitivePaneView[];
    _renderer: FootprintRenderer;

    constructor(chart: IChartApi, series: ISeriesApi<keyof SeriesOptionsMap>, settings: FootprintSettings) {
        this._chart = chart;
        this._series = series;
        this._settings = settings;
        
        this._renderer = new FootprintRenderer(chart, series, settings);
        
        this._paneViews = [{
            renderer: () => this._renderer,
            zOrder: () => 'top' as PrimitivePaneViewZOrder, 
        }];
    }

    updateData(data: FootprintCandle[]) {
        this._data = data;
        this._updateRenderer();
    }

    updateLastCandle(candle: FootprintCandle) {
        if (this._data.length === 0) {
            this._data.push(candle);
        } else {
            const last = this._data[this._data.length - 1];
            if (last.time === candle.time) {
                this._data[this._data.length - 1] = candle;
            } else {
                this._data.push(candle);
            }
        }
        this._updateRenderer();
    }
    
    updateSettings(settings: FootprintSettings) {
        this._settings = settings;
        this._updateRenderer();
    }

    _updateRenderer() {
        this._renderer.update(this._data, this._settings);
        // Force chart redraw
        this._series.applyOptions({}); 
    }

    paneViews() {
        return this._paneViews;
    }
}
