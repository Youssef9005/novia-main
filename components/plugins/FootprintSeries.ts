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
    if (num === 0) return '';
    if (Math.abs(num) >= 1_000_000) {
        return parseFloat((num / 1_000_000).toFixed(2)) + 'M';
    }
    if (Math.abs(num) >= 1_000) {
        return parseFloat((num / 1_000).toFixed(2)) + 'K';
    }
    // User requested K suffix for all numbers (e.g. 2 -> 2K)
    return num.toString() + 'K';
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
                buy: 'rgba(0, 227, 150, 0.12)', 
                sell: 'rgba(255, 69, 96, 0.12)', 
                imbalanceBuy: '#00E396', 
                imbalanceSell: '#FF4560', 
                text: '#E0E0E0', 
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
                buy: 'rgba(0, 227, 150, 0.12)', 
                sell: 'rgba(255, 69, 96, 0.12)', 
                imbalanceBuy: '#00E396', 
                imbalanceSell: '#FF4560', 
                text: '#E0E0E0', 
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
                buy: colorScheme.buy || 'rgba(0, 227, 150, 0.12)',
                sell: colorScheme.sell || 'rgba(255, 69, 96, 0.12)',
                imbalanceBuy: colorScheme.imbalanceBuy || '#00E396',
                imbalanceSell: colorScheme.imbalanceSell || '#FF4560',
                text: colorScheme.text || '#E0E0E0',
                background: colorScheme.background || 'transparent'
            };

            ctx.save();
            ctx.font = `${this._settings.fontSize}px sans-serif`; // e.g. "10px sans-serif"
            ctx.textBaseline = 'middle';

            // Constants
            const barSpacing = timeScale.options().barSpacing;
            // The total width available for the footprint columns
            const barWidth = Math.max(1, barSpacing * 0.95); 
            const gap = 1; // Gap between Bid and Ask columns
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
                        // Black cell for POC
                        bidBg = '#000000';
                        bidText = '#FFFFFF';
                    }

                    // Draw Bid Cell
                    // Add 3D/Gradient effect
                    if (index === pocIndex) {
                         ctx.fillStyle = '#000000';
                         ctx.fillRect(xLeft, topY + 0.5, columnWidth, cellHeight - 1);
                         // Neon Border for POC
                         ctx.strokeStyle = colors.imbalanceSell;
                         ctx.lineWidth = 1;
                         ctx.strokeRect(xLeft + 0.5, topY + 0.5, columnWidth - 1, cellHeight - 1);
                    } else if (level.imbalance === 'bid') {
                        // Gradient for Imbalance
                        const grd = ctx.createLinearGradient(xLeft, topY, xLeft + columnWidth, topY);
                        grd.addColorStop(0, colors.imbalanceSell);
                        grd.addColorStop(1, 'rgba(255, 69, 96, 0.8)');
                        ctx.fillStyle = grd;
                        ctx.fillRect(xLeft, topY + 0.5, columnWidth, cellHeight - 1);
                    } else {
                        // Regular cell
                        ctx.fillStyle = bidBg;
                        ctx.fillRect(xLeft, topY + 0.5, columnWidth, cellHeight - 1);
                    }

                    if (effectiveShowText) {
                        ctx.fillStyle = bidText;
                        ctx.textAlign = 'center';
                        ctx.font = `600 ${this._settings.fontSize}px sans-serif`; // Bolder font
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

                    // Draw Ask Cell
                    if (index === pocIndex) {
                         ctx.fillStyle = '#000000';
                         ctx.fillRect(xRight, topY + 0.5, columnWidth, cellHeight - 1);
                         // Neon Border for POC
                         ctx.strokeStyle = colors.imbalanceBuy;
                         ctx.lineWidth = 1;
                         ctx.strokeRect(xRight + 0.5, topY + 0.5, columnWidth - 1, cellHeight - 1);
                    } else if (level.imbalance === 'ask') {
                        // Gradient for Imbalance
                        const grd = ctx.createLinearGradient(xRight, topY, xRight + columnWidth, topY);
                        grd.addColorStop(0, colors.imbalanceBuy);
                        grd.addColorStop(1, 'rgba(0, 227, 150, 0.8)');
                        ctx.fillStyle = grd;
                        ctx.fillRect(xRight, topY + 0.5, columnWidth, cellHeight - 1);
                    } else {
                        ctx.fillStyle = askBg;
                        ctx.fillRect(xRight, topY + 0.5, columnWidth, cellHeight - 1);
                    }

                    if (effectiveShowText) {
                        ctx.fillStyle = askText;
                        ctx.textAlign = 'center';
                        ctx.font = `600 ${this._settings.fontSize}px sans-serif`;
                        // Always draw if showText is true
                        ctx.fillText(formatVolume(level.ask), xRight + columnWidth / 2, y);
                    }
                });

                // 4. Draw Delta Summary Box (Modern/Neon Style)
                if (this._settings.showDeltaSummary) {
                    const yLow = this._series.priceToCoordinate(candle.low);
                    if (yLow !== null) {
                        const boxY = yLow + 20; 
                        const boxWidth = Math.max(90, barWidth * 1.2); 
                        const boxHeight = 40;
                        const boxX = x - boxWidth / 2;

                        // Only draw if we have enough horizontal space or if it's the hovered candle (not handled here yet)
                        // Lower threshold to ensure it shows up more often
                        if (barSpacing > 40) {
                            // Main Box Background (Dark Semi-transparent)
                            ctx.fillStyle = 'rgba(10, 10, 10, 0.85)';
                            ctx.beginPath();
                            if (ctx.roundRect) {
                                ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 6);
                            } else {
                                ctx.rect(boxX, boxY, boxWidth, boxHeight); // Fallback
                            }
                            ctx.fill();
                            
                            // Border (Colored by Delta)
                            const deltaColor = candle.delta > 0 ? colors.imbalanceBuy : colors.imbalanceSell;
                            ctx.strokeStyle = deltaColor;
                            ctx.lineWidth = 1;
                            ctx.stroke();

                            // Subtle Glow
                            ctx.shadowColor = deltaColor;
                            ctx.shadowBlur = 8;
                            ctx.shadowOffsetX = 0;
                            ctx.shadowOffsetY = 0;
                            ctx.stroke(); // Re-stroke for glow effect
                            ctx.shadowColor = 'transparent'; // Reset

                            // Text
                            ctx.textAlign = 'center';
                            
                            // Delta Line
                            ctx.font = 'bold 11px sans-serif';
                            ctx.fillStyle = deltaColor; 
                            ctx.fillText(`Delta  ${formatVolume(candle.delta)}`, x, boxY + 14);

                            // Total Line
                            ctx.fillStyle = '#E0E0E0'; // Light Grey
                            ctx.font = '11px sans-serif';
                            ctx.fillText(`Total  ${formatVolume(candle.volume)}`, x, boxY + 28);
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
