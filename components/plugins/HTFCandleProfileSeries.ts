
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

    draw(target: CanvasRenderingTarget2D) {
        target.useMediaCoordinateSpace(({ context: ctx, mediaSize }: { context: CanvasRenderingContext2D, mediaSize: { width: number, height: number } }) => {
            if (!this._data || this._data.length === 0 || !this._settings.enabled) return;

            const timeScale = this._chart.timeScale();
            // Basic visibility check
            if (timeScale.getVisibleLogicalRange() === null) return;

            const colors = this._settings.colorScheme;
            const alignRight = this._settings.align === 'right';
            const widthPct = this._settings.widthPercentage / 100;

            this._data.forEach(htf => {
                const startTime = htf.time as Time;
                // We need to find the X coordinate range for this HTF candle.
                // Since lightweight-charts doesn't strictly map arbitrary timestamps to X if they aren't in the series data,
                // we assume the main series has data covering these times.
                
                const xStart = timeScale.timeToCoordinate(startTime);
                
                // Calculate End X.
                // Ideally, it's the coordinate of the next HTF start or the current candle's end time.
                // We'll try to get the coordinate of the end time.
                // If the end time is not in the data (e.g. future), we might need to project.
                // A safer way is to measure duration in bars if possible, or just look at the next HTF candle in the list.
                
                let xEnd: number | null = null;
                
                // Try direct mapping
                // Note: htf.endTime is exclusive usually, so we might want the coordinate of the last bar in the interval.
                // Let's assume htf.endTime is the start of the next period.
                const endTime = htf.endTime as Time;
                const potentialEnd = timeScale.timeToCoordinate(endTime);
                
                if (potentialEnd !== null) {
                    xEnd = potentialEnd;
                } else {
                    // If we can't find the end coordinate (e.g. rightmost edge), use the latest visible coordinate + projection?
                    // Or just default to a fixed width if we can't determine.
                    // Let's try to find the coordinate of the last data point in this HTF candle.
                    // This is hard without the raw list of candles in the renderer.
                    // Workaround: Use barSpacing * duration_in_bars (approx) or just xStart + fixed pixels? No.
                    // Better: If xStart is valid, and this is the last candle, extend to the right edge or some reasonable width.
                    if (xStart !== null) {
                        // Estimate based on time difference?
                        // For now, let's look for the next HTF candle in the list
                        const nextHTF = this._data.find(c => c.time > htf.time);
                        if (nextHTF) {
                            const nextX = timeScale.timeToCoordinate(nextHTF.time as Time);
                            if (nextX !== null) xEnd = nextX;
                        }
                    }
                }
                
                // If still null (maybe typically for the last candle), use the latest coordinate of the chart?
                if (xEnd === null && xStart !== null) {
                    // Just extend to current scroll position or a bit further
                    // Or use a default width based on the visible range?
                    // Let's skip if we can't determine width properly, or default to xStart + 50 (bad).
                    // Actually, if we are at the rightmost, xEnd could be mediaSize.width or similar if zoomed in?
                    // Let's try to get the coordinate of the *last* candle in the series if it's within this HTF.
                    // If htf is the latest, xEnd can be the coordinate of the last series bar + half bar width.
                    // Simplified:
                    // If xStart is visible, draw.
                }

                if (xStart === null) return;
                
                // Default width if xEnd is missing (e.g. latest candle)
                const effectiveXEnd = xEnd !== null ? xEnd : (xStart + 100); // Fallback
                
                const width = effectiveXEnd - xStart;
                if (width <= 0) return;

                // Candle Body / Box
                // High/Low
                const yHigh = this._series.priceToCoordinate(htf.high);
                const yLow = this._series.priceToCoordinate(htf.low);
                
                if (yHigh === null || yLow === null) return;

                const height = yLow - yHigh; // y is inverted (0 at top)
                
                // Draw Box/Outline
                if (this._settings.showOutline) {
                    ctx.strokeStyle = htf.close >= htf.open ? colors.outlineUp : colors.outlineDown;
                    ctx.lineWidth = 1;
                    ctx.strokeRect(xStart, yHigh, width, height);
                }

                // Draw Profile
                if (this._settings.showProfile && htf.levels.length > 0) {
                    // Find max volume in this profile for scaling
                    const maxVol = Math.max(...htf.levels.map(l => l.volume));
                    const profileWidth = width * widthPct; // e.g. 70% of the box width

                    // Calculate tick height (approx)
                    const tickHeight = height / htf.levels.length; 
                    // Or better: calculate from price difference of levels if available
                    // For rendering, we'll iterate levels
                    
                    ctx.fillStyle = htf.close >= htf.open ? colors.profileUp : colors.profileDown;
                    ctx.globalAlpha = 0.5; // Transparent profile

                    htf.levels.forEach(level => {
                        const y = this._series.priceToCoordinate(level.price);
                        if (y === null) return;
                        
                        // Height of one level bar. 
                        // If levels are dense, this might be small. 
                        // We can calculate it based on next level price or just fixed 1px min.
                        // Let's try to infer from neighbors or passed tick size? 
                        // We don't have tick size here. Let's assume uniform distribution or simple 1px lines if dense.
                        // Better: Draw a rect centered at y.
                        
                        // Calculate bar length based on volume
                        const barLen = (level.volume / maxVol) * profileWidth;
                        
                        const barHeight = Math.max(1, (height / htf.levels.length) - 0.5);
                        const barY = y - (barHeight / 2);

                        const barX = alignRight 
                            ? (xStart + width) - barLen 
                            : xStart;

                        ctx.fillRect(barX, barY, barLen, barHeight);
                    });
                    
                    ctx.globalAlpha = 1.0;
                }

                // Draw POC
                if (this._settings.showPOC) {
                    const yPoc = this._series.priceToCoordinate(htf.pocPrice);
                    if (yPoc !== null) {
                        ctx.strokeStyle = colors.poc;
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(xStart, yPoc);
                        ctx.lineTo(xStart + width, yPoc);
                        ctx.stroke();
                    }
                }

            });
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
