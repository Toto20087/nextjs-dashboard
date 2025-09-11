import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface StrategyComparisonModalProps {
  strategies: Array<{
    id: string;
    name: string;
    return: number;
    sharpe: number;
    drawdown: number;
    trades: number;
    status: string;
    winRate: number;
    profitFactor: number;
  }>;
  selectedStrategy1: string;
  selectedStrategy2: string;
  onStrategy1Change: (value: string) => void;
  onStrategy2Change: (value: string) => void;
}

export const StrategyComparisonModal = ({
  strategies,
  selectedStrategy1,
  selectedStrategy2,
  onStrategy1Change,
  onStrategy2Change
}: StrategyComparisonModalProps) => {
  const strategy1 = strategies.find(s => s.id === selectedStrategy1);
  const strategy2 = strategies.find(s => s.id === selectedStrategy2);

  const getComparisonColor = (val1: number, val2: number, higherIsBetter: boolean = true) => {
    if (higherIsBetter) {
      return val1 > val2 ? 'text-success' : val1 < val2 ? 'text-destructive' : 'text-muted-foreground';
    } else {
      return val1 < val2 ? 'text-success' : val1 > val2 ? 'text-destructive' : 'text-muted-foreground';
    }
  };

  const getPerformanceDifference = (val1: number, val2: number, suffix: string = '%') => {
    const diff = val1 - val2;
    const sign = diff > 0 ? '+' : '';
    return `${sign}${diff.toFixed(2)}${suffix}`;
  };

  return (
    <div className="space-y-6">
      {/* Strategy Selection */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Strategy 1</label>
          <Select value={selectedStrategy1} onValueChange={onStrategy1Change}>
            <SelectTrigger>
              <SelectValue placeholder="Select first strategy..." />
            </SelectTrigger>
            <SelectContent>
              {strategies.map((strategy) => (
                <SelectItem key={strategy.id} value={strategy.id}>
                  {strategy.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Strategy 2</label>
          <Select value={selectedStrategy2} onValueChange={onStrategy2Change}>
            <SelectTrigger>
              <SelectValue placeholder="Select second strategy..." />
            </SelectTrigger>
            <SelectContent>
              {strategies.map((strategy) => (
                <SelectItem key={strategy.id} value={strategy.id}>
                  {strategy.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {strategy1 && strategy2 && (
        <div className="space-y-6">
          {/* Performance Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 font-medium">Metric</th>
                      <th className="text-center py-3 font-medium">{strategy1.id}</th>
                      <th className="text-center py-3 font-medium">{strategy2.id}</th>
                      <th className="text-center py-3 font-medium">Difference</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-3 font-medium">Total Return</td>
                      <td className={`text-center financial-data ${getComparisonColor(strategy1.return, strategy2.return)}`}>
                        {strategy1.return >= 0 ? '+' : ''}{strategy1.return}%
                      </td>
                      <td className={`text-center financial-data ${getComparisonColor(strategy2.return, strategy1.return)}`}>
                        {strategy2.return >= 0 ? '+' : ''}{strategy2.return}%
                      </td>
                      <td className="text-center financial-data">
                        {getPerformanceDifference(strategy1.return, strategy2.return)}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 font-medium">Sharpe Ratio</td>
                      <td className={`text-center financial-data ${getComparisonColor(strategy1.sharpe, strategy2.sharpe)}`}>
                        {strategy1.sharpe}
                      </td>
                      <td className={`text-center financial-data ${getComparisonColor(strategy2.sharpe, strategy1.sharpe)}`}>
                        {strategy2.sharpe}
                      </td>
                      <td className="text-center financial-data">
                        {getPerformanceDifference(strategy1.sharpe, strategy2.sharpe, '')}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 font-medium">Max Drawdown</td>
                      <td className={`text-center financial-data ${getComparisonColor(strategy1.drawdown, strategy2.drawdown, false)}`}>
                        -{strategy1.drawdown}%
                      </td>
                      <td className={`text-center financial-data ${getComparisonColor(strategy2.drawdown, strategy1.drawdown, false)}`}>
                        -{strategy2.drawdown}%
                      </td>
                      <td className="text-center financial-data">
                        {getPerformanceDifference(-strategy1.drawdown, -strategy2.drawdown)}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 font-medium">Win Rate</td>
                      <td className={`text-center financial-data ${getComparisonColor(strategy1.winRate, strategy2.winRate)}`}>
                        {strategy1.winRate}%
                      </td>
                      <td className={`text-center financial-data ${getComparisonColor(strategy2.winRate, strategy1.winRate)}`}>
                        {strategy2.winRate}%
                      </td>
                      <td className="text-center financial-data">
                        {getPerformanceDifference(strategy1.winRate, strategy2.winRate)}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 font-medium">Profit Factor</td>
                      <td className={`text-center financial-data ${getComparisonColor(strategy1.profitFactor, strategy2.profitFactor)}`}>
                        {strategy1.profitFactor}
                      </td>
                      <td className={`text-center financial-data ${getComparisonColor(strategy2.profitFactor, strategy1.profitFactor)}`}>
                        {strategy2.profitFactor}
                      </td>
                      <td className="text-center financial-data">
                        {getPerformanceDifference(strategy1.profitFactor, strategy2.profitFactor, '')}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 font-medium">Total Trades</td>
                      <td className="text-center financial-data">{strategy1.trades}</td>
                      <td className="text-center financial-data">{strategy2.trades}</td>
                      <td className="text-center financial-data">
                        {strategy1.trades - strategy2.trades}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Performance Summary */}
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{strategy1.id} Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Strategy Name</span>
                    <span className="font-medium">{strategy1.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Status</span>
                    <Badge className={strategy1.status === 'live' ? 'bg-success/20 text-success border-success/30' : 'bg-warning/20 text-warning border-warning/30'}>
                      {strategy1.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Risk Level</span>
                    <span className="font-medium">
                      {strategy1.sharpe > 2 ? 'Low' : strategy1.sharpe > 1.5 ? 'Medium' : 'High'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Trade Frequency</span>
                    <span className="font-medium">
                      {strategy1.trades > 150 ? 'High' : strategy1.trades > 100 ? 'Medium' : 'Low'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{strategy2.id} Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Strategy Name</span>
                    <span className="font-medium">{strategy2.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Status</span>
                    <Badge className={strategy2.status === 'live' ? 'bg-success/20 text-success border-success/30' : 'bg-warning/20 text-warning border-warning/30'}>
                      {strategy2.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Risk Level</span>
                    <span className="font-medium">
                      {strategy2.sharpe > 2 ? 'Low' : strategy2.sharpe > 1.5 ? 'Medium' : 'High'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Trade Frequency</span>
                    <span className="font-medium">
                      {strategy2.trades > 150 ? 'High' : strategy2.trades > 100 ? 'Medium' : 'Low'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Comparison Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {strategy1.sharpe > strategy2.sharpe && (
                  <div className="p-3 bg-success/10 border border-success/30 rounded-lg">
                    <p className="text-sm text-success">
                      <strong>{strategy1.id}</strong> has better risk-adjusted returns with {strategy1.sharpe} vs {strategy2.sharpe} Sharpe ratio.
                    </p>
                  </div>
                )}
                {strategy2.sharpe > strategy1.sharpe && (
                  <div className="p-3 bg-success/10 border border-success/30 rounded-lg">
                    <p className="text-sm text-success">
                      <strong>{strategy2.id}</strong> has better risk-adjusted returns with {strategy2.sharpe} vs {strategy1.sharpe} Sharpe ratio.
                    </p>
                  </div>
                )}
                {Math.abs(strategy1.drawdown) < Math.abs(strategy2.drawdown) && (
                  <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
                    <p className="text-sm text-primary">
                      <strong>{strategy1.id}</strong> has lower maximum drawdown ({strategy1.drawdown}% vs {strategy2.drawdown}%), indicating better downside protection.
                    </p>
                  </div>
                )}
                {Math.abs(strategy2.drawdown) < Math.abs(strategy1.drawdown) && (
                  <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
                    <p className="text-sm text-primary">
                      <strong>{strategy2.id}</strong> has lower maximum drawdown ({strategy2.drawdown}% vs {strategy1.drawdown}%), indicating better downside protection.
                    </p>
                  </div>
                )}
                {strategy1.winRate > strategy2.winRate && (
                  <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
                    <p className="text-sm text-warning">
                      <strong>{strategy1.id}</strong> has higher win rate ({strategy1.winRate}% vs {strategy2.winRate}%), suggesting more consistent performance.
                    </p>
                  </div>
                )}
                {strategy2.winRate > strategy1.winRate && (
                  <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
                    <p className="text-sm text-warning">
                      <strong>{strategy2.id}</strong> has higher win rate ({strategy2.winRate}% vs {strategy1.winRate}%), suggesting more consistent performance.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {(!strategy1 || !strategy2) && (
        <div className="text-center py-8 text-muted-foreground">
          Please select two strategies to compare their performance metrics.
        </div>
      )}
    </div>
  );
};