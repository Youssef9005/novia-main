import {
    ISeriesPrimitive,
    IPrimitivePaneRenderer,
    IPrimitivePaneView,
    PrimitivePaneViewZOrder,
    ISeriesApi,
    SeriesOptionsMap,
    Time
} from 'lightweight-charts';

export interface AnalysisLevel {
    price: number;
    color: string;
    width: number; // Height in pixels
    label: string;
    textColor?: string;
}

class AnalysisOverlayRenderer implements IPrimitivePaneRenderer {
    _levels: AnalysisLevel[];
    _series: ISeriesApi<keyof SeriesOptionsMap> | null = null;

    constructor(levels: AnalysisLevel[]) {
        this._levels = levels;
    }

    setSeries(series: ISeriesApi<keyof SeriesOptionsMap> | null) {
        this._series = series;
    }

    draw(target: any) {
        target.useMediaCoordinateSpace(({ context: ctx, mediaSize }: { context: CanvasRenderingContext2D, mediaSize: { width: number, height: number } }) => {
            if (!this._series) return;
            
            const width = mediaSize.width;

            ctx.save();
            
            this._levels.forEach(level => {
                const y = this._series?.priceToCoordinate(level.price);
                if (y === null || y === undefined) return;

                // Draw Band
                const halfHeight = level.width / 2;
                const top = y - halfHeight;
                
                // Fill
                ctx.fillStyle = level.color;
                ctx.fillRect(0, top, width, level.width);

                // Draw Label
                if (level.label) {
                    ctx.font = 'bold 12px "Roboto Mono", monospace';
                    ctx.fillStyle = level.textColor || '#FFFFFF';
                    ctx.textBaseline = 'middle';
                    ctx.textAlign = 'right';
                    // Draw label on the right side with some padding
                    ctx.fillText(level.label, width - 10, y);
                }
            });

            ctx.restore();
        });
    }
}

export class AnalysisOverlay implements ISeriesPrimitive<Time> {
    _renderer: AnalysisOverlayRenderer;
    _paneViews: AnalysisOverlayPaneView[];

    constructor(levels: AnalysisLevel[]) {
        this._renderer = new AnalysisOverlayRenderer(levels);
        this._paneViews = [new AnalysisOverlayPaneView(this._renderer)];
    }

    attached({ series }: { series: ISeriesApi<keyof SeriesOptionsMap>; requestUpdate: () => void }): void {
        this._renderer.setSeries(series);
    }

    detached(): void {
        this._renderer.setSeries(null);
    }

    paneViews(): readonly IPrimitivePaneView[] {
        return this._paneViews;
    }

    priceAxisViews() { return []; }
    timeAxisViews() { return []; }
    autoscaleInfo() { return null; }
    hitTest() { return null; }
    
    updateLevels(levels: AnalysisLevel[]) {
        this._renderer._levels = levels;
    }
}

class AnalysisOverlayPaneView implements IPrimitivePaneView {
    _renderer: AnalysisOverlayRenderer;

    constructor(renderer: AnalysisOverlayRenderer) {
        this._renderer = renderer;
    }

    renderer(): IPrimitivePaneRenderer {
        return this._renderer;
    }

    zOrder(): PrimitivePaneViewZOrder {
        return 'bottom'; // Draw behind candlesticks so they remain visible
    }
}
