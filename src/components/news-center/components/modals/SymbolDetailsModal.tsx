import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";

interface SymbolDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: {
    id: number;
    symbol: string;
    name: string;
    exchange?: string;
    is_watched: boolean;
  };
}

export const SymbolDetailsModal: React.FC<SymbolDetailsModalProps> = ({
  isOpen,
  onClose,
  symbol
}) => {
  // Query to fetch current market data for symbol details
  const { data: symbolCurrentData, isLoading: isSymbolCurrentDataLoading } = useQuery({
    queryKey: ['symbol-current-data', symbol?.symbol],
    queryFn: async () => {
      if (!symbol?.symbol) return null;
      
      try {
        const response = await fetch(`/api/market-data/${symbol.symbol}`);
        if (!response.ok) throw new Error('Failed to fetch current market data');
        const data = await response.json();
        return data.data || null;
      } catch (error) {
        console.log('No current market data available:', error);
        return null;
      }
    },
    enabled: !!symbol?.symbol && isOpen,
    retry: false,
  });

  // Query to fetch historical market data for chart
  const { data: symbolHistoryData, isLoading: isSymbolHistoryDataLoading } = useQuery({
    queryKey: ['symbol-history-data', symbol?.symbol],
    queryFn: async () => {
      if (!symbol?.symbol) return null;
      
      try {
        const response = await fetch(`/api/market-data/${symbol.symbol}/history?days=30`);
        if (!response.ok) throw new Error('Failed to fetch historical market data');
        const data = await response.json();
        return data.data.bars || [];
      } catch (error) {
        console.log('No historical market data available:', error);
        return [];
      }
    },
    enabled: !!symbol?.symbol && isOpen,
    retry: false,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {symbol?.symbol} - {symbol?.name}
          </DialogTitle>
        </DialogHeader>
        
        {symbol && (
          <div className="space-y-6">
            {/* Current Market Data */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {isSymbolCurrentDataLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-6 w-16 mb-2" />
                      <Skeleton className="h-8 w-20" />
                    </CardContent>
                  </Card>
                ))
              ) : symbolCurrentData ? (
                <>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground">Current Price</div>
                      <div className="text-2xl font-bold">${symbolCurrentData.close?.toFixed(2) || 'N/A'}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground">Volume</div>
                      <div className="text-2xl font-bold">{symbolCurrentData.volume?.toLocaleString() || 'N/A'}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground">High</div>
                      <div className="text-2xl font-bold">${symbolCurrentData.high?.toFixed(2) || 'N/A'}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground">Low</div>
                      <div className="text-2xl font-bold">${symbolCurrentData.low?.toFixed(2) || 'N/A'}</div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="col-span-4">
                  <CardContent className="p-4 text-center">
                    <div className="text-muted-foreground">No current market data available</div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Price Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Price Chart - Last 30 Days</CardTitle>
                <CardDescription>Daily closing prices for {symbol.symbol}</CardDescription>
              </CardHeader>
              <CardContent>
                {isSymbolHistoryDataLoading ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="space-y-2 text-center">
                      <Skeleton className="h-4 w-32 mx-auto" />
                      <Skeleton className="h-4 w-24 mx-auto" />
                    </div>
                  </div>
                ) : symbolHistoryData && symbolHistoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={symbolHistoryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        }}
                      />
                      <YAxis 
                        domain={['dataMin - 1', 'dataMax + 1']}
                        tickFormatter={(value) => `$${value.toFixed(2)}`}
                      />
                      <Tooltip 
                        formatter={(value: any, name: string) => {
                          if (name === 'close') {
                            return [`$${Number(value).toFixed(2)}`, 'Close Price'];
                          }
                          return [value, name];
                        }}
                        labelFormatter={(label) => {
                          const date = new Date(label);
                          return date.toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          });
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="close" 
                        stroke="hsl(var(--chart-1))" 
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No historical price data available for this symbol
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Trading Metrics & Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
              {/* Key Trading Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Key Trading Metrics</CardTitle>
                  <CardDescription>Important metrics for trading decisions</CardDescription>
                </CardHeader>
                <CardContent>
                  {symbolHistoryData && symbolHistoryData.length > 0 ? (
                    <div className="space-y-4">
                      {(() => {
                        const prices = symbolHistoryData.map((bar: any) => bar.close);
                        const volumes = symbolHistoryData.map((bar: any) => bar.volume);
                        const currentPrice = prices[prices.length - 1];
                        const previousPrice = prices[prices.length - 2];
                        
                        // Calculate metrics
                        const priceChange = currentPrice - previousPrice;
                        const priceChangePercent = ((priceChange / previousPrice) * 100);
                        const avgVolume = volumes.reduce((a: number, b: number) => a + b, 0) / volumes.length;
                        const currentVolume = volumes[volumes.length - 1];
                        const volumeRatio = currentVolume / avgVolume;
                        
                        // Volatility (standard deviation of returns)
                        const returns = prices.slice(1).map((price: number, i: number) => 
                          ((price - prices[i]) / prices[i]) * 100
                        );
                        const avgReturn = returns.reduce((a: number, b: number) => a + b, 0) / returns.length;
                        const volatility = Math.sqrt(
                          returns.reduce((sum: number, ret: number) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length
                        );
                        
                        // Support and Resistance
                        const high30d = Math.max(...symbolHistoryData.map((bar: any) => bar.high));
                        const low30d = Math.min(...symbolHistoryData.map((bar: any) => bar.low));
                        const range = high30d - low30d;
                        const positionInRange = ((currentPrice - low30d) / range) * 100;
                        
                        return (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-sm text-muted-foreground">Price Change (1D)</div>
                              <div className={`font-bold ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)} ({priceChangePercent.toFixed(1)}%)
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">30D Volatility</div>
                              <div className="font-medium">{volatility.toFixed(2)}%</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Avg Volume (30D)</div>
                              <div className="font-medium">{(avgVolume / 1000000).toFixed(1)}M</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Volume Ratio</div>
                              <div className={`font-medium ${volumeRatio > 1.5 ? 'text-orange-600' : volumeRatio > 1.2 ? 'text-yellow-600' : 'text-gray-600'}`}>
                                {volumeRatio.toFixed(1)}x
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">30D High</div>
                              <div className="font-medium">${high30d.toFixed(2)}</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">30D Low</div>
                              <div className="font-medium">${low30d.toFixed(2)}</div>
                            </div>
                            <div className="col-span-2">
                              <div className="text-sm text-muted-foreground">Position in 30D Range</div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      positionInRange > 80 ? 'bg-red-500' : 
                                      positionInRange > 60 ? 'bg-orange-500' : 
                                      positionInRange > 40 ? 'bg-yellow-500' : 
                                      positionInRange > 20 ? 'bg-blue-500' : 'bg-green-500'
                                    }`}
                                    style={{ width: `${positionInRange}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium">{positionInRange.toFixed(0)}%</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No historical data available for metrics calculation
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Symbol Information */}
            <Card>
              <CardHeader>
                <CardTitle>Symbol Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Symbol</div>
                    <div className="font-medium">{symbol.symbol}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Company Name</div>
                    <div className="font-medium">{symbol.name || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Exchange</div>
                    <div className="font-medium">{symbol.exchange || 'Unknown'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Status</div>
                    <Badge variant={symbol.is_watched ? 'default' : 'secondary'}>
                      {symbol.is_watched ? 'Watched' : 'Not Watched'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};