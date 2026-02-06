
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
import { HTFCandle, HTFSettings } from '@/types/htfTypes';

interface CanvasRenderingTarget2D {
    useMediaCoordinateSpace: (callback: (scope: { context: CanvasRenderingContext2D, mediaSize: { width: number, height: number } }) => void) => void;
}

class HTFProfileRenderer implements IPrimitivePaneRenderer {
    _data: HTFCandle[] = [];
    _settings: HTFSettings;
    _chart: IChartApi;
    _series: ISeriesApi<keyof SeriesOptionsMap>;

    constructor(chart: IChartApi, series: ISeriesApi<keyof SeriesOptionsMap>, settings: HTFSettings) {
        this._chart = chart;
        this._series = series;
        this._settings = settings;
    }

    update(data: HTFCandle[], settings: HTFSettings) {
        this._data = data;
        this._settings = settings;
    }

    _formatVolume(num: number): string {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }

    draw(target: CanvasRenderingTarget2D) {
        target.useMediaCoordinateSpace(({ context: ctx, mediaSize }: { context: CanvasRenderingContext2D, mediaSize: { width: number, height: number } }) => {
            if (!this._data || this._data.length === 0 || !this._settings.enabled) return;

            const timeScale = this._chart.timeScale();
            // Basic visibility check
            if (timeScale.getVisibleLogicalRange() === null) return;

            const colors = this._settings.colorScheme;
            const widthPct = this._settings.widthPercentage / 100;

            // Only process the LATEST HTF candle (the active one)
            // And anchor it to the RIGHT side of the screen
            if (this._data.length === 0) return;
            const htf = this._data[this._data.length - 1]; // Latest one

            // X Coordinates - Fixed to Right Side
            // mediaSize.width is the right edge
            const xRight = mediaSize.width;
            
            // Force maximize width for better visibility
            // User requested "bigger", so we use 85% of screen width by default if enabled
            // We ignore widthPct for now to force the size, or use it as a scaler on top of a large base
            const baseWidthUsage = 0.85; // 85% of screen width
            const profileWidthPixels = mediaSize.width * baseWidthUsage;

            const xStart = xRight - profileWidthPixels;
            
            // Candle Body / Box Vertical Range
            const yHigh = this._series.priceToCoordinate(htf.high);
            const yLow = this._series.priceToCoordinate(htf.low);
            
            if (yHigh === null || yLow === null) return;

            const height = yLow - yHigh; // y is inverted (0 at top)
            
            // Draw Box/Outline (Optional for right-side profile? Maybe just profile lines)
            if (this._settings.showOutline) {
                ctx.strokeStyle = htf.close >= htf.open ? colors.outlineUp : colors.outlineDown;
                ctx.lineWidth = 1;
                ctx.strokeRect(xStart, yHigh, profileWidthPixels, height);
            }

            // Draw Profile
            if (this._settings.showProfile && htf.levels.length > 0) {
                // --- BINNING LOGIC START ---
                // To ensure bars are thick enough (at least ~24px height), we group raw levels.
                // 1. Determine pixel height of the total range
                const rangeHeightPixels = Math.abs(yLow - yHigh);
                const minBarHeightPx = 24; // Target minimum height for text visibility
                
                // 2. Calculate ideal number of bins
                // If the range is small, we might have fewer bins than levels, which is fine.
                let targetBinCount = Math.floor(rangeHeightPixels / minBarHeightPx);
                if (targetBinCount < 1) targetBinCount = 1;
                
                // If raw levels are fewer than target bins, just use raw levels (they are already thick enough)
                // Otherwise, we need to merge.
                
                let levelsToRender: { price: number; volume: number }[] = htf.levels;

                if (htf.levels.length > targetBinCount) {
                     // Sort levels by price ascending
                     const sortedLevels = [...htf.levels].sort((a, b) => a.price - b.price);
                     
                     // Determine price range per bin
                     const minPrice = sortedLevels[0].price;
                     const maxPrice = sortedLevels[sortedLevels.length - 1].price;
                     const totalPriceRange = maxPrice - minPrice;
                     const pricePerBin = totalPriceRange / targetBinCount;
                     
                     const bins: { price: number; volume: number; count: number }[] = [];
                     
                     for (const lvl of sortedLevels) {
                         // Check if this level belongs to the next bin
                         // Simple linear binning: floor((price - min) / binSize)
                         const myBinIdx = Math.min(
                             targetBinCount - 1, 
                             Math.floor((lvl.price - minPrice) / pricePerBin)
                         );
                         
                         // Initialize bins if needed (sparse array handling)
                         while (bins.length <= myBinIdx) {
                             bins.push({ price: 0, volume: 0, count: 0 });
                         }
                         
                         bins[myBinIdx].volume += lvl.volume;
                         bins[myBinIdx].count++;
                         // We'll use average price for positioning
                         bins[myBinIdx].price += lvl.price; 
                     }
                     
                     // Finalize bins
                     levelsToRender = bins
                        .filter(b => b.count > 0)
                        .map(b => ({
                             price: b.price / b.count, // Average price center
                             volume: b.volume
                        }));
                }
                // --- BINNING LOGIC END ---

                // Recalculate maxVol for the NEW aggregated levels
                const maxVol = Math.max(...levelsToRender.map(l => l.volume));

                // Recalculate tickSize/height logic for aggregated levels
                let tickSize = 0;
                if (levelsToRender.length > 1) {
                    const prices = levelsToRender.map(l => l.price).sort((a, b) => a - b);
                    let minDiff = Infinity;
                    for (let i = 1; i < prices.length; i++) {
                        const diff = prices[i] - prices[i - 1];
                        if (diff > 0 && diff < minDiff) minDiff = diff;
                    }
                    if (minDiff !== Infinity) tickSize = minDiff;
                }

                levelsToRender.forEach(level => {
                    const y = this._series.priceToCoordinate(level.price);
                    if (y === null) return;
                    
                    // Calculate bar height based on tick size or fallback
                    let barHeight = 1;
                    if (tickSize > 0) {
                        const nextY = this._series.priceToCoordinate(level.price + tickSize);
                        if (nextY !== null) {
                            barHeight = Math.abs(y - nextY);
                        }
                    } else {
                         // Fallback if only 1 bin or weird spacing
                        barHeight = Math.max(minBarHeightPx, (height / levelsToRender.length) - 0.5);
                    }
                    
                    // Cap max spacing gap visually? No, just ensure it fills mostly.
                    // Actually, for binning, we want the bars to touch or be close.
                    // Let's force barHeight to be at least minBarHeightPx - 2 (margin)
                    if (barHeight < minBarHeightPx) barHeight = minBarHeightPx;
                    
                    // Value Area Logic (Approximate for bins)
                    const inVA = (htf.valueAreaHigh !== undefined && htf.valueAreaLow !== undefined) &&
                                    (level.price <= htf.valueAreaHigh && level.price >= htf.valueAreaLow);
                    
                    // Set Global Alpha based on VA - Slightly transparent for all, more opaque for VA
                    const alpha = (this._settings.showValueArea && inVA) ? 0.9 : 0.5;
                    ctx.globalAlpha = alpha;

                    // Calculate bar length based on volume
                    const barLen = (level.volume / maxVol) * profileWidthPixels;
                    const barY = y - (barHeight / 2);

                    // Always align Right for this mode
                    const barX = xRight - barLen;

                    // Determine if this is the Point of Control (POC) for coloring
                    const isPoc = level.volume === maxVol;

                    // Match Volume Profile colors
                    // POC: Orange-ish, Non-POC: Blue-ish
                    ctx.fillStyle = isPoc ? "rgba(255, 179, 0, 0.5)" : "rgba(41, 98, 255, 0.4)";
                    ctx.fillRect(barX, barY, barLen, barHeight);

                    ctx.strokeStyle = isPoc ? "#FFB300" : "#2962FF";
                    ctx.lineWidth = 1;
                    ctx.strokeRect(barX, barY, barLen, barHeight);

                    // Draw Volume Text (White, Inside Tube, Professional Style)
                    // Now that bars are guaranteed to be ~24px+, we can always draw text
                    if (true) { 
                         // Reset alpha for text to be fully opaque and crisp
                         ctx.globalAlpha = 1.0;
                         
                         ctx.fillStyle = '#FFFFFF';
                         // System UI font stack for professional look, Larger size 13px
                         ctx.font = '700 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
                         
                         // Enhanced Shadow for readability against blue
                         ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
                         ctx.shadowBlur = 3;
                         ctx.shadowOffsetY = 1;
                         
                         ctx.textAlign = 'right';
                         ctx.textBaseline = 'middle';
                         const volText = this._formatVolume(level.volume);
                         
                         // Draw inside the bar, aligned to right edge with balanced padding
                         ctx.fillText(volText, xRight - 10, barY + barHeight / 2);
                         
                         // Reset shadow
                         ctx.shadowColor = 'transparent';
                         ctx.shadowBlur = 0;
                         ctx.shadowOffsetY = 0;
                         
                         // Restore alpha for next iteration (though loop resets it)
                         ctx.globalAlpha = alpha;
                    }
                });
                
                ctx.globalAlpha = 1.0;

                // Draw VA Lines if enabled
                if (this._settings.showValueArea && htf.valueAreaHigh !== undefined && htf.valueAreaLow !== undefined) {
                    const yVah = this._series.priceToCoordinate(htf.valueAreaHigh);
                    const yVal = this._series.priceToCoordinate(htf.valueAreaLow);
                    
                    ctx.lineWidth = 1;
                    ctx.setLineDash([2, 2]);
                    
                    if (yVah !== null) {
                        ctx.strokeStyle = colors.vah || '#808080';
                        ctx.beginPath();
                        ctx.moveTo(xStart, yVah);
                        ctx.lineTo(xRight, yVah);
                        ctx.stroke();
                    }
                    if (yVal !== null) {
                        ctx.strokeStyle = colors.val || '#808080';
                        ctx.beginPath();
                        ctx.moveTo(xStart, yVal);
                        ctx.lineTo(xRight, yVal);
                        ctx.stroke();
                    }
                    ctx.setLineDash([]);
                }
            }

            // Draw POC
            if (this._settings.showPOC) {
                const yPoc = this._series.priceToCoordinate(htf.pocPrice);
                if (yPoc !== null) {
                    ctx.strokeStyle = colors.poc;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(xStart, yPoc);
                    ctx.lineTo(xRight, yPoc);
                    ctx.stroke();
                }
            }
        });
    }
}

export class HTFCandleProfileSeries implements ISeriesPrimitive {
    _chart: IChartApi;
    _series: ISeriesApi<keyof SeriesOptionsMap>;
    _settings: HTFSettings;
    _data: HTFCandle[] = [];
    _paneViews: IPrimitivePaneView[];
    _renderer: HTFProfileRenderer;

    constructor(chart: IChartApi, series: ISeriesApi<keyof SeriesOptionsMap>, settings: HTFSettings) {
        this._chart = chart;
        this._series = series;
        this._settings = settings;
        
        this._renderer = new HTFProfileRenderer(chart, series, settings);
        
        this._paneViews = [{
            renderer: () => this._renderer,
            zOrder: () => 'normal' as PrimitivePaneViewZOrder, 
        }];
    }

    updateData(data: HTFCandle[]) {
        this._data = data;
        this._updateRenderer();
    }

    updateSettings(settings: HTFSettings) {
        this._settings = settings;
        this._updateRenderer();
    }

    _updateRenderer() {
        this._renderer.update(this._data, this._settings);
        // Request update
        // this._series.applyOptions({}); // Trigger redraw?
        // Lightweight charts doesn't have a direct "redraw" for primitives sometimes, 
        // but updating the renderer reference or data usually works on next frame.
    }

    paneViews() {
        return this._paneViews;
    }
}
