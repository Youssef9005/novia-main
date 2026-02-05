import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { 
  Indicator, Drawing, Alert, ChartTemplate, DrawingType, Timeframe,
  ConfluenceSettings, LiquiditySettings, SmartAlert, PivotSettings, EntryLineSettings
} from '@/types';
import { SRSettings, TradeSetup } from '@/types/srTypes';
import { FootprintSettings } from '@/types/footprintTypes';
import { HTFSettings } from '@/types/htfTypes';

interface ChartState {
  // Chart Config
  symbol: string;
  interval: Timeframe;
  symbolTimeframes: Record<string, Timeframe>;
  currentPrice: number;
  setSymbol: (symbol: string) => void;
  setInterval: (interval: Timeframe) => void;
  setCurrentPrice: (price: number) => void;

  // Pivots
  pivotSettings: PivotSettings;
  setPivotSettings: (settings: Partial<PivotSettings>) => void;
  togglePivots: () => void;

  // Entry Line
  entryLineSettings: EntryLineSettings;
  setEntryLineSettings: (settings: Partial<EntryLineSettings>) => void;
  toggleEntryLine: () => void;

  // SR Zones
  srSettings: SRSettings;
  setSRSettings: (settings: Partial<SRSettings>) => void;
  
  // Setups
  availableSetups: TradeSetup[];
  setAvailableSetups: (setups: TradeSetup[]) => void;

  // Footprint
  footprintSettings: FootprintSettings;
  setFootprintSettings: (settings: Partial<FootprintSettings>) => void;
  toggleFootprint: () => void;

  // HTF Candle Profile
  htfSettings: HTFSettings;
  setHTFSettings: (settings: Partial<HTFSettings>) => void;
  toggleHTF: () => void;

  // Confluence
  confluenceSettings: ConfluenceSettings;
  setConfluenceSettings: (settings: Partial<ConfluenceSettings>) => void;

  // Liquidity
  liquiditySettings: LiquiditySettings;
  setLiquiditySettings: (settings: Partial<LiquiditySettings>) => void;

  // Risk Tool Defaults
  riskSettingsDefaults: {
    accountSize: number;
    riskPercent: number;
    riskRewardRatio: number;
  };
  setRiskSettingsDefaults: (settings: Partial<ChartState['riskSettingsDefaults']>) => void;

  // Smart Alerts
  smartAlerts: SmartAlert[];
  addSmartAlert: (alert: SmartAlert) => void;
  removeSmartAlert: (id: string) => void;
  toggleSmartAlert: (id: string) => void;
  updateSmartAlert: (id: string, updates: Partial<SmartAlert>) => void;

  // Indicators
  indicators: Indicator[];
  selectedIndicatorId: string | null;
  addIndicator: (indicator: Indicator) => void;
  removeIndicator: (id: string) => void;
  updateIndicator: (id: string, updates: Partial<Indicator>) => void;
  selectIndicator: (id: string | null) => void;
  reorderIndicators: (startIndex: number, endIndex: number) => void;
  
  // Drawings
  drawings: Drawing[];
  selectedTool: DrawingType;
  selectedDrawingId: string | null;
  addDrawing: (drawing: Drawing) => void;
  removeDrawing: (id: string) => void;
  updateDrawing: (id: string, updates: Partial<Drawing>) => void;
  setTool: (tool: DrawingType) => void;
  selectDrawing: (id: string | null) => void;
  clearDrawings: () => void;
  
  // Alerts
  alerts: Alert[];
  addAlert: (alert: Alert) => void;
  removeAlert: (id: string) => void;
  toggleAlert: (id: string) => void;
  setAlertTriggered: (id: string, triggered: boolean) => void;
  
  // Templates
  templates: ChartTemplate[];
  saveTemplate: (template: ChartTemplate) => void;
  loadTemplate: (id: string) => void;
  deleteTemplate: (id: string) => void;
}

export const useChartStore = create<ChartState>()(
  persist(
    (set, get) => ({
      // Config
      symbol: 'BTCUSDT',
      interval: '1h',
      symbolTimeframes: {},
      currentPrice: 0,
      setSymbol: (symbol) => set((state) => {
        const lastTf = state.symbolTimeframes[symbol] || '1h';
        return { symbol, interval: lastTf };
      }),
      setInterval: (interval) => set((state) => ({ 
        interval,
        symbolTimeframes: { ...state.symbolTimeframes, [state.symbol]: interval }
      })),
      setCurrentPrice: (currentPrice) => set({ currentPrice }),

      // Pivots
      pivotSettings: {
        enabled: false,
        mode: 'AUTO',
        type: 'Classic',
        timeframe: 'Daily',
        showR4: true,
        showR3: true,
        showR2: true,
        showR1: true,
        showP: true,
        showS1: true,
        showS2: true,
        showS3: true,
        showS4: true,
        lineWidth: 1,
        lineStyle: 'solid',
        opacity: 0.8,
        showLabels: true,
        labelPosition: 'right',
        resistanceColor: '#22c55e',
        supportColor: '#22c55e',
        pivotColor: '#eab308',
      },
      setPivotSettings: (settings) => set((state) => ({
        pivotSettings: { ...state.pivotSettings, ...settings }
      })),
      togglePivots: () => set((state) => ({
        pivotSettings: { ...state.pivotSettings, enabled: !state.pivotSettings.enabled }
      })),

      // Entry Line
      entryLineSettings: {
        enabled: false,
        priceSource: 'manual',
        manualPrice: 0,
        label: 'Entry',
        color: '#eab308',
        lineWidth: 1,
        lineStyle: 'dashed',
      },
      setEntryLineSettings: (settings) => set((state) => ({
        entryLineSettings: { ...state.entryLineSettings, ...settings }
      })),
      toggleEntryLine: () => set((state) => ({
        entryLineSettings: { ...state.entryLineSettings, enabled: !state.entryLineSettings.enabled }
      })),

      // SR Zones
      srSettings: {
        enabled: false,
        pivotWindow: 5,
        toleranceType: 'atr',
        toleranceValue: 0.2,
        maxZones: 10,
        minStrength: 30,
        showLabels: true,
        fadeByRecency: true,
        mergeZones: true,
      },
      setSRSettings: (settings) => set((state) => ({
        srSettings: { ...state.srSettings, ...settings }
      })),

      // Setups
      availableSetups: [],
      setAvailableSetups: (setups) => set({ availableSetups: setups }),

      // Footprint
      footprintSettings: {
        enabled: false,
        mode: 'bid_ask',
        showText: true,
        showDeltaSummary: true,
        imbalanceRatio: 3.0,
        fontSize: 10,
        rowHeight: 'auto',
        colorScheme: {
          buy: 'rgba(0, 227, 150, 0.12)', 
          sell: 'rgba(255, 69, 96, 0.12)', 
          imbalanceBuy: '#00E396', 
          imbalanceSell: '#FF4560', 
          text: '#E0E0E0', 
          background: 'transparent'
        }
      },
      setFootprintSettings: (settings) => set((state) => ({
        footprintSettings: { ...state.footprintSettings, ...settings }
      })),
      toggleFootprint: () => set((state) => ({
        footprintSettings: { ...state.footprintSettings, enabled: !state.footprintSettings.enabled }
      })),

      // HTF Candle Profile
      htfSettings: {
        enabled: false,
        timeframe: 'Auto',
        showOutline: true,
        showProfile: true,
        showPOC: true,
        showValueArea: false,
        widthPercentage: 50,
        align: 'right',
        colorScheme: {
          outlineUp: '#089981',
          outlineDown: '#F23645',
          profileUp: '#B2DFDB',
          profileDown: '#FFCDD2',
          poc: '#FFFF00', // Yellow
          val: '#808080',
          vah: '#808080',
          background: 'transparent'
        }
      },
      setHTFSettings: (settings) => set((state) => ({
        htfSettings: { ...state.htfSettings, ...settings }
      })),
      toggleHTF: () => set((state) => ({
        htfSettings: { ...state.htfSettings, enabled: !state.htfSettings.enabled }
      })),

      // Confluence
      confluenceSettings: {
        enabled: false,
        visibleRangeOnly: true,
        sensitivity: 1.0,
        zonesCount: 6,
        zoneThickness: 20,
        intensityScale: 'auto',
        factors: {
          ema: true,
          vwap: true,
          atr: true,
          pdhl: true,
          pivots: true,
        }
      },
      setConfluenceSettings: (settings) => set((state) => ({
        confluenceSettings: { ...state.confluenceSettings, ...settings }
      })),

      // Liquidity
      liquiditySettings: {
        enabled: false,
        pivotPeriod: 5,
        tolerancePercent: 0.5,
        maxZones: 12,
        minStrength: 1,
        showLabels: true,
        fadeOlder: true,
      },
      setLiquiditySettings: (settings) => set((state) => ({
        liquiditySettings: { ...state.liquiditySettings, ...settings }
      })),

      // Risk Tool
      riskSettingsDefaults: {
        accountSize: 10000,
        riskPercent: 1.0,
        riskRewardRatio: 2.0,
      },
      setRiskSettingsDefaults: (settings) => set((state) => ({
        riskSettingsDefaults: { ...state.riskSettingsDefaults, ...settings }
      })),

      // Smart Alerts
      smartAlerts: [],
      addSmartAlert: (alert) => set((state) => ({ smartAlerts: [...state.smartAlerts, alert] })),
      removeSmartAlert: (id) => set((state) => ({ smartAlerts: state.smartAlerts.filter(a => a.id !== id) })),
      toggleSmartAlert: (id) => set((state) => ({
        smartAlerts: state.smartAlerts.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a)
      })),
      updateSmartAlert: (id, updates) => set((state) => ({
        smartAlerts: state.smartAlerts.map(a => a.id === id ? { ...a, ...updates } : a)
      })),

      // Indicators
      indicators: [
        { id: 'ema-20', type: 'EMA', period: 20, color: '#2962FF', pane: 'overlay', visible: true, order: 0 },
        { id: 'rsi-14', type: 'RSI', period: 14, color: '#8b5cf6', pane: 'separate', visible: true, order: 1 },
      ],
      selectedIndicatorId: null,
      addIndicator: (ind) => set((state) => ({ indicators: [...state.indicators, ind] })),
      removeIndicator: (id) => set((state) => ({ indicators: state.indicators.filter(i => i.id !== id) })),
      updateIndicator: (id, updates) => set((state) => ({
        indicators: state.indicators.map(i => i.id === id ? { ...i, ...updates } : i)
      })),
      selectIndicator: (id) => set({ selectedIndicatorId: id }),
      reorderIndicators: (startIndex, endIndex) => set((state) => {
        const result = Array.from(state.indicators);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        return { indicators: result.map((ind, index) => ({ ...ind, order: index })) };
      }),

      // Drawings
      drawings: [],
      selectedTool: 'cursor',
      selectedDrawingId: null,
      addDrawing: (d) => set((state) => ({ drawings: [...state.drawings, d] })),
      removeDrawing: (id) => set((state) => ({ drawings: state.drawings.filter(d => d.id !== id) })),
      updateDrawing: (id, updates) => set((state) => ({
        drawings: state.drawings.map(d => d.id === id ? { ...d, ...updates } : d)
      })),
      setTool: (tool) => set({ selectedTool: tool }),
      selectDrawing: (id) => set({ selectedDrawingId: id }),
      clearDrawings: () => set({ drawings: [] }),

      // Alerts
      alerts: [],
      addAlert: (alert) => set((state) => ({ alerts: [...state.alerts, alert] })),
      removeAlert: (id) => set((state) => ({ alerts: state.alerts.filter(a => a.id !== id) })),
      toggleAlert: (id) => set((state) => ({
        alerts: state.alerts.map(a => a.id === id ? { ...a, active: !a.active } : a)
      })),
      setAlertTriggered: (id, triggered) => set((state) => ({
        alerts: state.alerts.map(a => a.id === id ? { ...a, triggered } : a)
      })),

      // Templates
      templates: [],
      saveTemplate: (template) => set((state) => {
        const existing = state.templates.findIndex(t => t.id === template.id);
        if (existing >= 0) {
          const newTemplates = [...state.templates];
          newTemplates[existing] = template;
          return { templates: newTemplates };
        }
        return { templates: [...state.templates, template] };
      }),
      loadTemplate: (id) => {
        const t = get().templates.find(t => t.id === id);
        if (t) {
          set({
            indicators: t.indicators,
            drawings: t.drawings,
            interval: t.timeframe,
            symbol: t.symbol
          });
        }
      },
      deleteTemplate: (id) => set((state) => ({
        templates: state.templates.filter(t => t.id !== id)
      })),
    }),
    {
      name: 'chart-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
