import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { ScrollArea } from '../../ui/scroll-area';
import { Checkbox } from '../../ui/checkbox';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  BarChart3,
  TrendingUp,
  Activity,
  Layers,
  Target,
  Zap,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Download,
  Eye,
  Plus,
  Minus,
  Grid,
  PieChart
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  ReferenceLine,
  ScatterChart,
  Scatter
} from 'recharts';

// Mock advanced price data with technical indicators
const priceData = [
  {
    date: '2024-01-15',
    open: 185.20,
    high: 187.50,
    low: 184.10,
    close: 186.80,
    volume: 45670000,
    sma20: 183.45,
    sma50: 181.20,
    ema12: 185.90,
    ema26: 184.30,
    rsi: 68.4,
    macd: 0.85,
    macdSignal: 0.72,
    macdHist: 0.13,
    bb_upper: 188.90,
    bb_middle: 185.20,
    bb_lower: 181.50,
    vwap: 186.15,
    atr: 2.85
  },
  {
    date: '2024-01-16',
    open: 186.80,
    high: 189.20,
    low: 186.00,
    close: 188.50,
    volume: 52340000,
    sma20: 183.98,
    sma50: 181.45,
    ema12: 186.75,
    ema26: 184.85,
    rsi: 71.2,
    macd: 0.92,
    macdSignal: 0.78,
    macdHist: 0.14,
    bb_upper: 189.15,
    bb_middle: 185.65,
    bb_lower: 182.15,
    vwap: 187.82,
    atr: 2.92
  },
  {
    date: '2024-01-17',
    open: 188.50,
    high: 190.80,
    low: 187.30,
    close: 189.60,
    volume: 48920000,
    sma20: 184.52,
    sma50: 181.78,
    ema12: 187.45,
    ema26: 185.38,
    rsi: 73.8,
    macd: 0.98,
    macdSignal: 0.83,
    macdHist: 0.15,
    bb_upper: 189.85,
    bb_middle: 186.20,
    bb_lower: 182.55,
    vwap: 188.95,
    atr: 3.01
  },
  {
    date: '2024-01-18',
    open: 189.60,
    high: 192.30,
    low: 189.10,
    close: 191.75,
    volume: 56780000,
    sma20: 185.15,
    sma50: 182.12,
    ema12: 188.65,
    ema26: 186.02,
    rsi: 76.5,
    macd: 1.08,
    macdSignal: 0.89,
    macdHist: 0.19,
    bb_upper: 190.45,
    bb_middle: 186.85,
    bb_lower: 183.25,
    vwap: 190.85,
    atr: 3.15
  }
];

// Strategy flow nodes for visual strategy building
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'input',
    position: { x: 100, y: 100 },
    data: { label: 'Market Data Input' }
  },
  {
    id: '2',
    type: 'default',
    position: { x: 300, y: 100 },
    data: { label: 'RSI(14) > 70?' }
  },
  {
    id: '3',
    type: 'default',
    position: { x: 500, y: 50 },
    data: { label: 'SELL Signal' }
  },
  {
    id: '4',
    type: 'default',
    position: { x: 500, y: 150 },
    data: { label: 'Check MACD' }
  },
  {
    id: '5',
    type: 'output',
    position: { x: 700, y: 150 },
    data: { label: 'BUY Signal' }
  }
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e2-3', source: '2', target: '3', label: 'Yes' },
  { id: 'e2-4', source: '2', target: '4', label: 'No' },
  { id: 'e4-5', source: '4', target: '5' }
];

// Backtest visualization data
const backtestResults = [
  {
    date: '2024-01-15',
    strategy: 1850,
    benchmark: 1825,
    drawdown: 0,
    positions: 3,
    trades: 0
  },
  {
    date: '2024-01-16',
    strategy: 1920,
    benchmark: 1840,
    drawdown: -25,
    positions: 4,
    trades: 2
  },
  {
    date: '2024-01-17',
    strategy: 1875,
    benchmark: 1855,
    drawdown: -45,
    positions: 3,
    trades: 1
  },
  {
    date: '2024-01-18',
    strategy: 1975,
    benchmark: 1870,
    drawdown: 0,
    positions: 5,
    trades: 3
  }
];

// Available technical indicators
const availableIndicators = [
  { id: 'sma20', name: 'SMA(20)', color: '#3b82f6', enabled: true },
  { id: 'sma50', name: 'SMA(50)', color: '#f59e0b', enabled: true },
  { id: 'ema12', name: 'EMA(12)', color: '#10b981', enabled: false },
  { id: 'ema26', name: 'EMA(26)', color: '#8b5cf6', enabled: false },
  { id: 'bb_upper', name: 'Bollinger Upper', color: '#ef4444', enabled: false },
  { id: 'bb_lower', name: 'Bollinger Lower', color: '#ef4444', enabled: false },
  { id: 'vwap', name: 'VWAP', color: '#06b6d4', enabled: false }
];

export const AdvancedCharts = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1D');
  const [activeTab, setActiveTab] = useState('technical');
  const [indicators, setIndicators] = useState(availableIndicators);
  const [showVolume, setShowVolume] = useState(true);
  const [chartType, setChartType] = useState('candlestick');
  
  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const toggleIndicator = (id: string) => {
    setIndicators(prev => 
      prev.map(indicator => 
        indicator.id === id 
          ? { ...indicator, enabled: !indicator.enabled }
          : indicator
      )
    );
  };

  const enabledIndicators = indicators.filter(ind => ind.enabled);

  // Custom Candlestick component for Recharts
  const Candlestick = ({ x, y, width, height, payload }: any) => {
    if (!payload) return null;
    
    const { open, high, low, close } = payload;
    const isGreen = close >= open;
    const bodyHeight = Math.abs(close - open);
    const bodyY = Math.min(close, open);
    
    return (
      <g>
        {/* Wick */}
        <line
          x1={x + width / 2}
          y1={y}
          x2={x + width / 2}
          y2={y + height}
          stroke={isGreen ? '#10b981' : '#ef4444'}
          strokeWidth={1}
        />
        {/* Body */}
        <rect
          x={x + width * 0.2}
          y={bodyY}
          width={width * 0.6}
          height={bodyHeight || 1}
          fill={isGreen ? '#10b981' : '#ef4444'}
          stroke={isGreen ? '#10b981' : '#ef4444'}
        />
      </g>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced Trading Charts</h2>
          <p className="text-muted-foreground">Interactive charting and strategy visualization</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AAPL">AAPL</SelectItem>
              <SelectItem value="MSFT">MSFT</SelectItem>
              <SelectItem value="TSLA">TSLA</SelectItem>
              <SelectItem value="NVDA">NVDA</SelectItem>
              <SelectItem value="SPY">SPY</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-16">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">1m</SelectItem>
              <SelectItem value="5m">5m</SelectItem>
              <SelectItem value="15m">15m</SelectItem>
              <SelectItem value="1H">1H</SelectItem>
              <SelectItem value="1D">1D</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Main Chart Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="technical">Technical Analysis</TabsTrigger>
          <TabsTrigger value="backtest">Backtest Visualization</TabsTrigger>
        </TabsList>

        <TabsContent value="technical" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Indicator Controls */}
            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="text-sm">Chart Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Chart Type</label>
                  <Select value={chartType} onValueChange={setChartType}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="candlestick">Candlestick</SelectItem>
                      <SelectItem value="line">Line</SelectItem>
                      <SelectItem value="area">Area</SelectItem>
                      <SelectItem value="bar">OHLC Bar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Technical Indicators</label>
                  <ScrollArea className="h-48">
                    <div className="space-y-2">
                      {indicators.map((indicator) => (
                        <div key={indicator.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={indicator.id}
                            checked={indicator.enabled}
                            onCheckedChange={() => toggleIndicator(indicator.id)}
                          />
                          <label
                            htmlFor={indicator.id}
                            className="text-xs flex items-center gap-2"
                          >
                            <div
                              className="w-3 h-3 rounded"
                              style={{ backgroundColor: indicator.color }}
                            />
                            {indicator.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="volume"
                    checked={showVolume}
                    onCheckedChange={(checked) => setShowVolume(checked === true)}
                  />
                  <label htmlFor="volume" className="text-xs">Show Volume</label>
                </div>
              </CardContent>
            </Card>

            {/* Main Price Chart */}
            <Card className="trading-card lg:col-span-3">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    {selectedSymbol} - {selectedTimeframe} Chart
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Minus className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Grid className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={priceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    
                    {/* Price Line/Area based on chart type */}
                    {chartType === 'line' && (
                      <Line
                        type="monotone"
                        dataKey="close"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={false}
                        name="Close Price"
                      />
                    )}
                    
                    {chartType === 'area' && (
                      <Area
                        type="monotone"
                        dataKey="close"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.3}
                        name="Close Price"
                      />
                    )}

                    {/* Technical Indicators */}
                    {enabledIndicators.map((indicator) => (
                      <Line
                        key={indicator.id}
                        type="monotone"
                        dataKey={indicator.id}
                        stroke={indicator.color}
                        strokeWidth={1.5}
                        dot={false}
                        name={indicator.name}
                      />
                    ))}
                  </ComposedChart>
                </ResponsiveContainer>

                {/* Volume Chart */}
                {showVolume && (
                  <ResponsiveContainer width="100%" height={100}>
                    <BarChart data={priceData}>
                      <XAxis dataKey="date" hide />
                      <YAxis hide />
                      <Bar dataKey="volume" fill="hsl(var(--muted))" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Oscillator Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="text-sm">RSI (14)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={priceData}>
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" />
                    <ReferenceLine y={70} stroke="hsl(var(--destructive))" strokeDasharray="2 2" />
                    <ReferenceLine y={30} stroke="hsl(var(--success))" strokeDasharray="2 2" />
                    <Line 
                      type="monotone" 
                      dataKey="rsi" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="text-sm">MACD</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={150}>
                  <ComposedChart data={priceData}>
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <ReferenceLine y={0} stroke="hsl(var(--border))" />
                    <Bar dataKey="macdHist" fill="hsl(var(--muted))" />
                    <Line 
                      type="monotone" 
                      dataKey="macd" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="macdSignal" 
                      stroke="hsl(var(--warning))" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="backtest" className="space-y-4">
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Strategy vs Benchmark Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={backtestResults}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" />
                  <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Legend />
                  
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="drawdown"
                    stroke="hsl(var(--destructive))"
                    fill="hsl(var(--destructive))"
                    fillOpacity={0.2}
                    name="Drawdown"
                  />
                  
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="strategy"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    name="Strategy"
                  />
                  
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="benchmark"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Benchmark"
                  />
                  
                  <Bar
                    yAxisId="right"
                    dataKey="trades"
                    fill="hsl(var(--success))"
                    fillOpacity={0.5}
                    name="Daily Trades"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="trading-card">
              <CardContent className="p-4 text-center">
                <div className="text-sm text-muted-foreground">Total Return</div>
                <div className="text-2xl font-bold text-success">+6.8%</div>
              </CardContent>
            </Card>
            <Card className="trading-card">
              <CardContent className="p-4 text-center">
                <div className="text-sm text-muted-foreground">Sharpe Ratio</div>
                <div className="text-2xl font-bold">1.84</div>
              </CardContent>
            </Card>
            <Card className="trading-card">
              <CardContent className="p-4 text-center">
                <div className="text-sm text-muted-foreground">Max Drawdown</div>
                <div className="text-2xl font-bold text-destructive">-2.4%</div>
              </CardContent>
            </Card>
            <Card className="trading-card">
              <CardContent className="p-4 text-center">
                <div className="text-sm text-muted-foreground">Win Rate</div>
                <div className="text-2xl font-bold">71.4%</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>


      </Tabs>
    </div>
  );
};