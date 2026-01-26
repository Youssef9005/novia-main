
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
        const isMobile = window.innerWidth < 768;
        
        // Adjust thresholds for mobile to prevent clutter
        // On mobile, we need more zoom (larger barSpacing) to start showing details
        const detailsThreshold = isMobile ? 35 : 20; 
        const textThreshold = isMobile ? 55 : 40;

        // Adjust width based on zoom
        const gap = 8; // Gap between Buy and Sell columns (Increased from 2)
        const cellWidth = (barSpacing * 0.45) - (gap / 2); 
        
        // Dynamic font size calculation
        // We want the font to fit within cellWidth with some padding
        // Start with a rough estimate based on barSpacing
        const calculatedFontSize = barSpacing * 0.35; // Increased from 0.3 for better visibility
        
        // Clamp font size
        // Min size: 7px (barely readable) - below this we shouldn't render text
        // Max size: 12px (desktop), 10px (mobile)
        const minFontSize = 10; // Increased min size
        const maxFontSize = isMobile ? 13 : 16; // Increased max size
        
        const fontSize = Math.min(maxFontSize, Math.max(minFontSize, calculatedFontSize));
        
        ctx.font = `bold ${fontSize.toFixed(1)}px "Roboto Mono", monospace`;
        ctx.textBaseline = 'middle';

        // Helper to shorten large numbers
        const formatVol = (v: number) => {
            if (v >= 10000) return (v / 1000).toFixed(0) + 'k'; // 12k
            if (v >= 1000) return (v / 1000).toFixed(1) + 'k'; // 1.2k
            return v.toString();
        };

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
            if (barSpacing <= detailsThreshold) {
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
                
                // If rowHeight is invalid or 0, fallback
                if (rowHeight <= 0) rowHeight = 20;

                // FIX: Strictly limit drawHeight to rowHeight to prevent vertical overlap
                // Subtract 1px for visual separation
                const drawHeight = Math.max(1, rowHeight - 0.5); 
                
                const halfGap = gap / 2;
                const leftX = x - halfGap - cellWidth;
                const rightX = x + halfGap;

                // --- Backgrounds ---
                // Imbalance Buy (Green)
                if (level.imbalance === 'buy') {
                    ctx.fillStyle = 'rgba(8, 153, 129, 0.5)'; // Increased opacity
                    ctx.fillRect(rightX, y - drawHeight/2, cellWidth, drawHeight);
                }
                // Imbalance Sell (Red)
                else if (level.imbalance === 'sell') {
                    ctx.fillStyle = 'rgba(242, 54, 69, 0.5)'; // Increased opacity
                    ctx.fillRect(leftX, y - drawHeight/2, cellWidth, drawHeight);
                }

                // POC Highlight (Yellow Border)
                const isPOC = level.volume === maxVol;
                
                if (isPOC) {
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = '#FFD700'; // Gold
                    // POC covers both columns + gap
                    ctx.strokeRect(leftX, y - drawHeight/2, (cellWidth * 2) + gap, drawHeight);
                }

                // Grid lines (Horizontal)
                // Only draw if we have enough height
                if (rowHeight > 4) {
                    // Left side
                    ctx.beginPath();
                    ctx.moveTo(leftX, y + drawHeight/2);
                    ctx.lineTo(leftX + cellWidth, y + drawHeight/2);
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                    
                    // Right side
                    ctx.beginPath();
                    ctx.moveTo(rightX, y + drawHeight/2);
                    ctx.lineTo(rightX + cellWidth, y + drawHeight/2);
                    ctx.stroke();
                }

                // --- Text ---
                // FIX: Only render text if we have enough VERTICAL space
                // AND enough horizontal space
                if (barSpacing > textThreshold && calculatedFontSize >= minFontSize && rowHeight >= 12) {
                    
                    const sellText = formatVol(level.sell);
                    const buyText = formatVol(level.buy);

                    // Check if text fits in cellWidth
                    const sellWidth = ctx.measureText(sellText).width;
                    const buyWidth = ctx.measureText(buyText).width;
                    
                    // Allow small overflow (10%) but not massive overlap
                    const maxTextWidth = cellWidth * 1.1;

                    // Adjust font size to fit vertically
                    // Ensure text doesn't bleed into next row
                    const maxVerticalFontSize = rowHeight * 0.85;
                    const finalFontSize = Math.min(fontSize, maxVerticalFontSize);

                    // Skip if text would be too tiny
                    if (finalFontSize < 9) return;

                    const fontSpec = `bold ${finalFontSize.toFixed(1)}px "Roboto Mono", monospace`;

                    // Sell Volume (Left)
                    if (sellWidth <= maxTextWidth) {
                        ctx.textAlign = 'center';
                        
                        // Color logic: White if imbalance, Gray otherwise
                        ctx.fillStyle = level.imbalance === 'sell' ? '#FFFFFF' : '#9ca3af';
                        if (level.imbalance === 'sell') ctx.font = fontSpec;
                        else ctx.font = `${finalFontSize.toFixed(1)}px "Roboto Mono", monospace`;

                        // Add shadow for better contrast
                        ctx.shadowColor = 'rgba(0,0,0,0.8)';
                        ctx.shadowBlur = 2;

                        if (level.sell > 0) ctx.fillText(sellText, leftX + cellWidth/2, y);
                        
                        ctx.shadowColor = 'transparent'; // Reset
                        ctx.shadowBlur = 0;
                    }
                    
                    // Buy Volume (Right)
                    if (buyWidth <= maxTextWidth) {
                        ctx.textAlign = 'center';
                        ctx.fillStyle = level.imbalance === 'buy' ? '#FFFFFF' : '#9ca3af';
                        if (level.imbalance === 'buy') ctx.font = fontSpec;
                        else ctx.font = `${finalFontSize.toFixed(1)}px "Roboto Mono", monospace`;

                        // Add shadow for better contrast
                        ctx.shadowColor = 'rgba(0,0,0,0.8)';
                        ctx.shadowBlur = 2;

                        if (level.buy > 0) ctx.fillText(buyText, rightX + cellWidth/2, y);

                        ctx.shadowColor = 'transparent'; // Reset
                        ctx.shadowBlur = 0;
                    }
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
