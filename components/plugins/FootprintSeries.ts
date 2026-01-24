
import {
	CustomSeriesPricePlotValues,
	ICustomSeriesPaneView,
	PaneRendererCustomData,
	Time,
	WhitespaceData,
    ICustomSeriesPaneRenderer,
    CustomSeriesOptions,
} from 'lightweight-charts';

export interface FootprintLevel {
    price: number;
    buy: number;
    sell: number;
    volume: number;
    imbalance?: 'buy' | 'sell' | 'none'; // 300% ratio
}

export interface FootprintData {
	time: Time;
	open: number;
	high: number;
	low: number;
	close: number;
    profile: FootprintLevel[];
    // Add custom color if needed for CustomData compatibility
    color?: string; 
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface FootprintSeriesOptions extends CustomSeriesOptions {
    // Custom options specific to footprint
}

class FootprintSeriesRenderer implements ICustomSeriesPaneRenderer {
	_data: PaneRendererCustomData<Time, FootprintData> | null = null;
	_options: FootprintSeriesOptions | null = null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
	draw(target: any, priceConverter: any): void {
		target.useMediaCoordinateSpace(({ context: ctx }: { context: CanvasRenderingContext2D }) => {
            this._drawImpl(ctx, priceConverter);
        });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _drawImpl(ctx: CanvasRenderingContext2D, priceConverter: any): void {
		if (!this._data || this._data.bars.length === 0) return;
		
        ctx.save();

        const barSpacing = this._data.barSpacing;
        // Adjust width based on zoom
        const cellWidth = barSpacing * 0.45; // Leave 10% gap
        const fontSize = Math.min(11, Math.max(8, barSpacing * 0.18));
        
        ctx.font = `bold ${fontSize}px "Roboto Mono", monospace`;
        ctx.textBaseline = 'middle';

        // Safe converter wrapper
        const toY = (price: number) => {
            if (typeof priceConverter === 'function') return priceConverter(price);
            if (priceConverter?.convert) return priceConverter.convert(price);
            return null;
        };

		this._data.bars.forEach(bar => {
            if (!bar.originalData || !bar.originalData.profile) return;
            
            const data = bar.originalData;
            const x = bar.x;
            const isUp = data.close >= data.open;
            
            // Calculate Candle Body & Wick
            const highY = toY(data.high);
            const lowY = toY(data.low);
            const openY = toY(data.open);
            const closeY = toY(data.close);
            
            if (highY === null || lowY === null || openY === null || closeY === null) return;

            // Draw Wick
            ctx.beginPath();
            ctx.moveTo(x, highY);
            ctx.lineTo(x, lowY);
            ctx.strokeStyle = isUp ? '#089981' : '#F23645';
            ctx.lineWidth = 1;
            ctx.stroke();

            // If zoomed out, draw regular candle body
            if (barSpacing <= 20) {
                 const bodyTop = Math.min(openY, closeY);
                 const bodyHeight = Math.max(1, Math.abs(closeY - openY));
                 ctx.fillStyle = isUp ? '#089981' : '#F23645';
                 ctx.fillRect(x - barSpacing * 0.25, bodyTop, barSpacing * 0.5, bodyHeight);
                 return; // Skip footprint details
            }
            
            // Find POC (Max Volume)
            let maxVol = 0;
            // let pocIndex = -1;
            data.profile.forEach((level) => {
                if (level.volume > maxVol) {
                    maxVol = level.volume;
                    // pocIndex = idx;
                }
            });

            // Sort profile for rendering (High Price to Low Price usually, but Y coordinates handle this)
            // We iterate profile.
            
            const sortedProfile = [...data.profile].sort((a, b) => b.price - a.price);

            sortedProfile.forEach((level, index) => {
                const y = toY(level.price);
                if (y === null) return;

                // Determine row height
                // Estimate based on previous/next
                let rowHeight = 0;
                if (index < sortedProfile.length - 1) {
                    const nextY = toY(sortedProfile[index + 1].price);
                    if (nextY !== null) rowHeight = Math.abs(nextY - y);
                } else if (index > 0) {
                     const prevY = toY(sortedProfile[index - 1].price);
                     if (prevY !== null) rowHeight = Math.abs(y - prevY);
                }
                
                // Fallback height if single level or calc failed
                if (rowHeight === 0 || rowHeight > 50) rowHeight = 20; // Cap max height

                const drawHeight = Math.max(14, rowHeight); 
                
                const leftX = x - cellWidth;
                const rightX = x;

                // --- Backgrounds ---
                // Imbalance Buy (Green)
                if (level.imbalance === 'buy') {
                    ctx.fillStyle = 'rgba(8, 153, 129, 0.3)'; // Green
                    ctx.fillRect(rightX, y - drawHeight/2, cellWidth, drawHeight);
                }
                // Imbalance Sell (Red)
                else if (level.imbalance === 'sell') {
                    ctx.fillStyle = 'rgba(242, 54, 69, 0.3)'; // Red
                    ctx.fillRect(leftX, y - drawHeight/2, cellWidth, drawHeight);
                }

                // POC Highlight (Yellow Border)
                const isPOC = level.volume === maxVol;
                
                if (isPOC) {
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = '#FFD700'; // Gold
                    ctx.strokeRect(leftX, y - drawHeight/2, cellWidth * 2, drawHeight);
                }

                // Grid lines (Horizontal)
                ctx.beginPath();
                ctx.moveTo(leftX, y + drawHeight/2);
                ctx.lineTo(rightX + cellWidth, y + drawHeight/2);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
                ctx.lineWidth = 0.5;
                ctx.stroke();

                // --- Text ---
                if (barSpacing > 40) {
                    // Sell Volume (Left)
                    ctx.textAlign = 'center';
                    
                    // Color logic: White if imbalance, Gray otherwise
                    ctx.fillStyle = level.imbalance === 'sell' ? '#FFFFFF' : '#9ca3af';
                    if (level.imbalance === 'sell') ctx.font = `bold ${fontSize}px "Roboto Mono", monospace`;
                    else ctx.font = `${fontSize}px "Roboto Mono", monospace`;

                    if (level.sell > 0) ctx.fillText(level.sell.toString(), leftX + cellWidth/2, y);
                    
                    // Buy Volume (Right)
                    ctx.fillStyle = level.imbalance === 'buy' ? '#FFFFFF' : '#9ca3af';
                    if (level.imbalance === 'buy') ctx.font = `bold ${fontSize}px "Roboto Mono", monospace`;
                    else ctx.font = `${fontSize}px "Roboto Mono", monospace`;

                    if (level.buy > 0) ctx.fillText(level.buy.toString(), rightX + cellWidth/2, y);
                }
            });
            
            // Draw Box around the profile for this bar
            if (barSpacing > 40 && sortedProfile.length > 0) {
                const topY = toY(sortedProfile[0].price);
                const bottomY = toY(sortedProfile[sortedProfile.length-1].price);
                if (topY !== null && bottomY !== null) {
                    // Outer border
                    // ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                    // ctx.strokeRect(x - cellWidth, topY - 10, cellWidth * 2, (bottomY - topY) + 20);
                }
            }
		});

		ctx.restore();
	}

	update(data: PaneRendererCustomData<Time, FootprintData>, options: FootprintSeriesOptions): void {
		this._data = data;
		this._options = options;
	}
}

export class FootprintSeries implements ICustomSeriesPaneView<Time, FootprintData, FootprintSeriesOptions> {
	_renderer: FootprintSeriesRenderer;

	constructor() {
		this._renderer = new FootprintSeriesRenderer();
	}

	priceValueBuilder(plotRow: FootprintData): CustomSeriesPricePlotValues {
		return [plotRow.high, plotRow.low, plotRow.close];
	}

	isWhitespace(data: FootprintData | WhitespaceData): data is WhitespaceData {
		return (data as Partial<FootprintData>).close === undefined;
	}

	renderer(): ICustomSeriesPaneRenderer {
		return this._renderer;
	}

	update(
		data: PaneRendererCustomData<Time, FootprintData>,
		options: FootprintSeriesOptions
	): void {
		this._renderer.update(data, options);
	}

	defaultOptions(): FootprintSeriesOptions {
		return {
			...this._renderer._options,
		} as FootprintSeriesOptions;
	}
}
