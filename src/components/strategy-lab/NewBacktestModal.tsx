'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ScrollArea } from '../ui/scroll-area';
import { TrendingUp, BarChart3, Activity, Zap, Target, Brain, Layers, Loader2 } from 'lucide-react';
import { vectorBtService } from '../../services/api';
import { AvailableStrategy } from '../../types/vectorbt';
import { useToast } from '../ui/use-toast';

interface Strategy {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  defaultTickers: string[];
  parameters: Array<{
    name: string;
    label: string;
    type: 'number' | 'select' | 'boolean';
    defaultValue: number | string | boolean;
    min?: number;
    max?: number;
    step?: number;
    options?: string[];
    description?: string;
  }>;
}


const tickerOptions = [
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', sector: 'ETF - Broad Market', exchange: 'NYSE', price: 485.67, change: 2.34, changePercent: 0.48 },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', sector: 'ETF - Technology', exchange: 'NASDAQ', price: 412.89, change: -1.23, changePercent: -0.30 },
  { symbol: 'IWM', name: 'iShares Russell 2000 ETF', sector: 'ETF - Small Cap', exchange: 'NYSE', price: 234.56, change: 1.89, changePercent: 0.81 },
  { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', sector: 'ETF - Total Market', exchange: 'NYSE', price: 267.34, change: 0.95, changePercent: 0.36 },
  { symbol: 'XLF', name: 'Financial Select Sector SPDR Fund', sector: 'ETF - Financial', exchange: 'NYSE', price: 42.78, change: 0.67, changePercent: 1.59 },
  { symbol: 'XLK', name: 'Technology Select Sector SPDR Fund', sector: 'ETF - Technology', exchange: 'NYSE', price: 198.45, change: -0.45, changePercent: -0.23 },
  { symbol: 'XLE', name: 'Energy Select Sector SPDR Fund', sector: 'ETF - Energy', exchange: 'NYSE', price: 89.23, change: 2.11, changePercent: 2.42 },
  { symbol: 'XLV', name: 'Health Care Select Sector SPDR Fund', sector: 'ETF - Healthcare', exchange: 'NYSE', price: 132.67, change: 0.34, changePercent: 0.26 },
  { symbol: 'XLP', name: 'Consumer Staples Select Sector SPDR Fund', sector: 'ETF - Consumer Staples', exchange: 'NYSE', price: 78.91, change: -0.12, changePercent: -0.15 },
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', exchange: 'NASDAQ', price: 189.34, change: 1.67, changePercent: 0.89 },
  { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology', exchange: 'NASDAQ', price: 412.78, change: -2.34, changePercent: -0.56 },
  { symbol: 'GOOGL', name: 'Alphabet Inc. Class A', sector: 'Technology', exchange: 'NASDAQ', price: 167.89, change: 0.78, changePercent: 0.47 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Discretionary', exchange: 'NASDAQ', price: 145.67, change: 2.11, changePercent: 1.47 },
  { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Consumer Discretionary', exchange: 'NASDAQ', price: 234.89, change: -5.67, changePercent: -2.36 },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology', exchange: 'NASDAQ', price: 789.45, change: 12.34, changePercent: 1.59 },
  { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Technology', exchange: 'NASDAQ', price: 489.12, change: -3.45, changePercent: -0.70 },
  { symbol: 'BRK.B', name: 'Berkshire Hathaway Inc. Class B', sector: 'Financial Services', exchange: 'NYSE', price: 456.78, change: 1.23, changePercent: 0.27 },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financial Services', exchange: 'NYSE', price: 178.90, change: 0.89, changePercent: 0.50 },
  { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', exchange: 'NYSE', price: 156.78, change: -0.45, changePercent: -0.29 },
  { symbol: 'V', name: 'Visa Inc.', sector: 'Financial Services', exchange: 'NYSE', price: 289.34, change: 2.67, changePercent: 0.93 },
  { symbol: 'PG', name: 'Procter & Gamble Company', sector: 'Consumer Staples', exchange: 'NYSE', price: 167.45, change: 0.34, changePercent: 0.20 },
  { symbol: 'UNH', name: 'UnitedHealth Group Incorporated', sector: 'Healthcare', exchange: 'NYSE', price: 534.67, change: 4.56, changePercent: 0.86 },
  { symbol: 'HD', name: 'Home Depot Inc.', sector: 'Consumer Discretionary', exchange: 'NYSE', price: 378.90, change: -1.23, changePercent: -0.32 },
  { symbol: 'DIS', name: 'Walt Disney Company', sector: 'Communication Services', exchange: 'NYSE', price: 89.45, change: 0.67, changePercent: 0.75 },
  { symbol: 'PYPL', name: 'PayPal Holdings Inc.', sector: 'Financial Services', exchange: 'NASDAQ', price: 67.89, change: -0.89, changePercent: -1.29 },
  { symbol: 'NFLX', name: 'Netflix Inc.', sector: 'Communication Services', exchange: 'NASDAQ', price: 456.78, change: 3.45, changePercent: 0.76 },
  { symbol: 'KO', name: 'Coca-Cola Company', sector: 'Consumer Staples', exchange: 'NYSE', price: 62.34, change: 0.12, changePercent: 0.19 },
  { symbol: 'PEP', name: 'PepsiCo Inc.', sector: 'Consumer Staples', exchange: 'NASDAQ', price: 178.90, change: -0.23, changePercent: -0.13 },
  { symbol: 'WMT', name: 'Walmart Inc.', sector: 'Consumer Staples', exchange: 'NYSE', price: 167.45, change: 0.78, changePercent: 0.47 },
  { symbol: 'VZ', name: 'Verizon Communications Inc.', sector: 'Communication Services', exchange: 'NYSE', price: 41.23, change: -0.34, changePercent: -0.82 },
  { symbol: 'T', name: 'AT&T Inc.', sector: 'Communication Services', exchange: 'NYSE', price: 22.67, change: 0.11, changePercent: 0.49 },
  { symbol: 'XOM', name: 'Exxon Mobil Corporation', sector: 'Energy', exchange: 'NYSE', price: 118.90, change: 1.89, changePercent: 1.61 },
  { symbol: 'CVX', name: 'Chevron Corporation', sector: 'Energy', exchange: 'NYSE', price: 156.78, change: 0.67, changePercent: 0.43 },
  { symbol: 'PFE', name: 'Pfizer Inc.', sector: 'Healthcare', exchange: 'NYSE', price: 28.90, change: -0.12, changePercent: -0.41 },
  { symbol: 'MRK', name: 'Merck & Co. Inc.', sector: 'Healthcare', exchange: 'NYSE', price: 123.45, change: 0.89, changePercent: 0.73 }
];

interface TickerOption {
  symbol: string;
  name: string;
  sector: string;
  exchange: string;
  price: number;
  change: number;
  changePercent: number;
}

interface NewBacktestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NewBacktestModal: React.FC<NewBacktestModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { toast } = useToast();
  const [selectedStrategy, setSelectedStrategy] = useState<string>('');
  const [selectedTickers, setSelectedTickers] = useState<string[]>([]);
  const [strategyParams, setStrategyParams] = useState<Record<string, any>>({});
  const [capital, setCapital] = useState<string>('100000');
  const [backtestName, setBacktestName] = useState<string>('');
  const [tickerSearch, setTickerSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [showTickerDropdown, setShowTickerDropdown] = useState<boolean>(false);
  const [parameterMode, setParameterMode] = useState<'manual' | 'optimize'>('manual');
  const [startDate, setStartDate] = useState<string>('2024-01-01');
  const [endDate, setEndDate] = useState<string>('2024-12-31');
  const [walkForwardConfig, setWalkForwardConfig] = useState({
    enabled: false,
    windowSize: 252, // days
    stepSize: 63, // days (quarterly)
    optimizationPeriod: 504, // days (2 years)
    minTradeCount: 50
  });

  // Fetch available strategies from vector-bt
  const { data: vectorBtStrategies, isLoading: isLoadingStrategies } = useQuery({
    queryKey: ['vector-bt-strategies'],
    queryFn: async () => {
      const response = await vectorBtService.strategies.getAvailable();
      return response.data;
    },
    retry: 2,
  });

  // Transform backend strategies to component format
  const availableStrategies: Strategy[] = React.useMemo(() => {
    if (!vectorBtStrategies?.strategies) {
      // Fallback to hardcoded strategies when backend is unavailable
      return [
        {
          id: 'ensemble',
          name: 'Ensemble Strategy',
          description: 'Combines RSI, VWAP, MACD, and Bollinger Bands indicators',
          category: 'Ensemble',
          icon: <Brain className="w-4 h-4" />,
          defaultTickers: ['SPY', 'QQQ', 'IWM'],
          parameters: [
            // Required parameters
            { name: 'rsi_weight', label: 'RSI Weight', type: 'number', defaultValue: 0.25, min: 0, max: 1, step: 0.05, description: 'Weight for RSI indicator in ensemble' },
            { name: 'vwap_weight', label: 'VWAP Weight', type: 'number', defaultValue: 0.25, min: 0, max: 1, step: 0.05, description: 'Weight for VWAP indicator in ensemble' },
            { name: 'macd_weight', label: 'MACD Weight', type: 'number', defaultValue: 0.25, min: 0, max: 1, step: 0.05, description: 'Weight for MACD indicator in ensemble' },
            { name: 'bb_weight', label: 'Bollinger Bands Weight', type: 'number', defaultValue: 0.25, min: 0, max: 1, step: 0.05, description: 'Weight for Bollinger Bands in ensemble' },
            { name: 'entry_threshold', label: 'Entry Threshold', type: 'number', defaultValue: 0.2, min: 0.1, max: 0.5, step: 0.05, description: 'Threshold for entry signals' },
            // Optional parameters
            { name: 'rsi_period', label: 'RSI Period', type: 'number', defaultValue: 14.0, min: 5.0, max: 50.0, description: 'Period for RSI calculation' },
            { name: 'rsi_oversold', label: 'RSI Oversold', type: 'number', defaultValue: 30.0, min: 10.0, max: 40.0, description: 'RSI oversold threshold' },
            { name: 'rsi_overbought', label: 'RSI Overbought', type: 'number', defaultValue: 70.0, min: 60.0, max: 90.0, description: 'RSI overbought threshold' },
            { name: 'vwap_deviation', label: 'VWAP Deviation', type: 'number', defaultValue: 0.02, min: 0.01, max: 0.05, step: 0.01, description: 'VWAP deviation threshold' },
            { name: 'macd_fast', label: 'MACD Fast Period', type: 'number', defaultValue: 12.0, min: 5, max: 20, description: 'MACD fast EMA period' },
            { name: 'macd_slow', label: 'MACD Slow Period', type: 'number', defaultValue: 26.0, min: 20.0, max: 40.0, description: 'MACD slow EMA period' },
            { name: 'macd_signal', label: 'MACD Signal Period', type: 'number', defaultValue: 9.0, min: 5, max: 15, description: 'MACD signal EMA period' },
            { name: 'bb_period', label: 'Bollinger Bands Period', type: 'number', defaultValue: 20.0, min: 10, max: 30, description: 'Bollinger Bands period' },
            { name: 'bb_std', label: 'Bollinger Bands Std Dev', type: 'number', defaultValue: 2.0, min: 1.0, max: 3.0, step: 0.1, description: 'Bollinger Bands standard deviation' },
            { name: 'exit_threshold', label: 'Exit Threshold', type: 'number', defaultValue: 0.1, min: 0.05, max: 0.3, step: 0.05, description: 'Threshold for exit signals' },
            { name: 'stop_loss', label: 'Stop Loss', type: 'number', defaultValue: 0.03, min: 0.01, max: 0.1, step: 0.01, description: 'Stop loss percentage' },
            { name: 'take_profit', label: 'Take Profit', type: 'number', defaultValue: 0.08, min: 0.02, max: 0.2, step: 0.01, description: 'Take profit percentage' },
            { name: 'position_size', label: 'Position Size', type: 'number', defaultValue: 0.1, min: 0.05, max: 0.5, step: 0.05, description: 'Position size as fraction of capital' },
          ],
        },
        {
          id: 'rsi_vwap',
          name: 'RSI VWAP Strategy',
          description: 'Combines RSI and VWAP indicators for trend following',
          category: 'Technical',
          icon: <TrendingUp className="w-4 h-4" />,
          defaultTickers: ['SPY', 'QQQ'],
          parameters: [
            { name: 'rsi_period', label: 'RSI Period', type: 'number', defaultValue: 14.0, min: 5, max: 50, description: 'Period for RSI calculation' },
            { name: 'rsi_oversold', label: 'RSI Oversold', type: 'number', defaultValue: 30.0, min: 10, max: 40, description: 'RSI oversold threshold' },
            { name: 'rsi_overbought', label: 'RSI Overbought', type: 'number', defaultValue: 70.0, min: 60, max: 90, description: 'RSI overbought threshold' },
            { name: 'vwap_deviation', label: 'VWAP Deviation', type: 'number', defaultValue: 0.02, min: 0.01, max: 0.05, step: 0.01, description: 'VWAP deviation threshold' },
            { name: 'stop_loss', label: 'Stop Loss', type: 'number', defaultValue: 0.02, min: 0.01, max: 0.1, step: 0.01, description: 'Stop loss percentage' },
            { name: 'take_profit', label: 'Take Profit', type: 'number', defaultValue: 0.04, min: 0.02, max: 0.2, step: 0.01, description: 'Take profit percentage' },
          ],
        },
        {
          id: 'mean_reversion',
          name: 'Mean Reversion Strategy',
          description: 'Bollinger Bands based mean reversion strategy',
          category: 'Mean Reversion',
          icon: <Activity className="w-4 h-4" />,
          defaultTickers: ['SPY', 'IWM'],
          parameters: [
            { name: 'bb_period', label: 'Bollinger Bands Period', type: 'number', defaultValue: 20.0, min: 10, max: 30, description: 'Bollinger Bands period' },
            { name: 'bb_std', label: 'Bollinger Bands Std Dev', type: 'number', defaultValue: 2.0, min: 1.0, max: 3.0, step: 0.1, description: 'Bollinger Bands standard deviation' },
            { name: 'rsi_period', label: 'RSI Period', type: 'number', defaultValue: 14.0, min: 5, max: 50, description: 'Period for RSI calculation' },
            { name: 'rsi_oversold', label: 'RSI Oversold', type: 'number', defaultValue: 30.0, min: 10, max: 40, description: 'RSI oversold threshold' },
            { name: 'rsi_overbought', label: 'RSI Overbought', type: 'number', defaultValue: 70.0, min: 60, max: 90, description: 'RSI overbought threshold' },
            { name: 'position_size', label: 'Position Size', type: 'number', defaultValue: 0.1, min: 0.05, max: 0.5, step: 0.05, description: 'Position size as fraction of capital' },
          ],
        }
      ];
    }

    return vectorBtStrategies.strategies.map((strategy: any) => ({
      id: strategy.name,
      name: strategy.display_name || strategy.name,
      description: strategy.description || `${strategy.name} trading strategy`,
      category: 'Vector-BT',
      icon: <Activity className="w-4 h-4" />,
      defaultTickers: ['SPY', 'QQQ', 'IWM'],
      parameters: strategy.parameters ? Object.entries(strategy.parameters).map(([key, param]: [string, any]) => ({
        name: key,
        label: key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        type: param.type === 'int' ? 'number' : param.type === 'float' ? 'number' : param.type === 'bool' ? 'boolean' : 'number',
        defaultValue: param.default,
        min: param.min,
        max: param.max,
        description: `${key.replace(/_/g, ' ')} parameter`
      })) : []
    }));
  }, [vectorBtStrategies]);

  // Fetch parameter ranges for selected strategy
  const { data: parameterRanges } = useQuery({
    queryKey: ['parameter-ranges', selectedStrategy],
    queryFn: async () => {
      if (!selectedStrategy) return null;
      const response = await vectorBtService.strategies.getParameterRanges(selectedStrategy);
      return response.data;
    },
    enabled: !!selectedStrategy,
    retry: 1,
  });

  // Submit backtest mutation
  const submitBacktest = useMutation({
    mutationFn: async (backtestConfig: any) => {
      const response = await vectorBtService.backtests.runBacktest(backtestConfig);
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Backtest submitted successfully:', data);
      
      // Show success toast with job ID
      if (data.job_id) {
        toast({
          title: "Backtest Created Successfully",
          description: `Job ID: ${data.job_id}. Your backtest is now running.`,
        });
      } else {
        toast({
          title: "Backtest Submitted",
          description: "Your backtest has been submitted and is being processed.",
        });
      }
      
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error('Failed to submit backtest:', error);
      
      // Enhanced error handling with toast
      const errorMessage = error.response?.data?.detail || error.message || 'Unknown error occurred';
      toast({
        title: "Backtest Submission Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Use vector-bt strategies with fallback to mock data
  const availableStrategiesData = React.useMemo(() => {
    if (vectorBtStrategies?.strategies) {
      return vectorBtStrategies.strategies.map((strategy: AvailableStrategy) => ({
        id: strategy.name,
        name: strategy.display_name,
        description: strategy.description,
        category: 'Vector-BT',
        icon: <Activity className="w-4 h-4" />,
        defaultTickers: ['AAPL', 'MSFT', 'GOOGL'], // Default tickers
        parameters: Object.entries(strategy.parameters).map(([key, param]) => ({
          name: key,
          label: key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
          type: param.type === 'int' ? 'number' : param.type === 'float' ? 'number' : 'select',
          defaultValue: param.default,
          min: param.min,
          max: param.max,
          description: param.description,
        }))
      }));
    }
    return availableStrategies; // Fallback to mock data
  }, [vectorBtStrategies]);

  const currentStrategy = availableStrategiesData.find(s => s.id === selectedStrategy);
  
  const ITEMS_PER_PAGE = 10;
  
  const filteredTickers = tickerOptions.filter(ticker => 
    ticker.symbol.toLowerCase().includes(tickerSearch.toLowerCase()) ||
    ticker.name.toLowerCase().includes(tickerSearch.toLowerCase()) ||
    ticker.sector.toLowerCase().includes(tickerSearch.toLowerCase())
  );
  
  const totalPages = Math.ceil(filteredTickers.length / ITEMS_PER_PAGE);
  const paginatedTickers = filteredTickers.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  const handleStrategySelect = (strategyId: string) => {
    const strategy = availableStrategies.find(s => s.id === strategyId);
    if (strategy) {
      setSelectedStrategy(strategyId);
      setSelectedTickers(strategy.defaultTickers);
      
      // Initialize parameters with defaults - ensure ALL parameters are included and properly typed
      const defaultParams: Record<string, any> = {};
      strategy.parameters.forEach(param => {
        // FORCE all numeric parameters to be floats with explicit conversion
        if (param.type === 'number') {
          // Use Number constructor to ensure proper float conversion
          defaultParams[param.name] = Number(param.defaultValue);
          console.log(`Setting ${param.name} = ${defaultParams[param.name]} (type: ${typeof defaultParams[param.name]})`);
        } else {
          defaultParams[param.name] = param.defaultValue;
        }
      });
      setStrategyParams(defaultParams);
      
      // Set default name
      setBacktestName(`${strategy.name} - ${new Date().toLocaleDateString()}`);
      
      console.log(`Selected strategy: ${strategyId}, Parameters:`, defaultParams);
      console.log('Parameter types after selection:', Object.entries(defaultParams).map(([k, v]) => `${k}: ${typeof v}`));
    }
  };


  const handleTickerAdd = (tickerSymbol: string) => {
    if (!selectedTickers.includes(tickerSymbol)) {
      setSelectedTickers(prev => [...prev, tickerSymbol]);
    }
    setShowTickerDropdown(false);
    setTickerSearch('');
    setCurrentPage(0);
  };

  const handleTickerRemove = (tickerSymbol: string) => {
    setSelectedTickers(prev => prev.filter(t => t !== tickerSymbol));
  };

  const handleParameterChange = (paramName: string, value: any) => {
    // Ensure numeric values are always stored as floats
    let processedValue = value;
    if (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '') {
      processedValue = Number.parseFloat(value);
    } else if (typeof value === 'number') {
      processedValue = Number.parseFloat(value.toString());
    }
    
    setStrategyParams(prev => ({
      ...prev,
      [paramName]: processedValue,
    }));
  };

  const handleCreateBacktest = () => {
    // Find the current strategy to ensure we have all parameters
    const currentStrategyData = availableStrategies.find(s => s.id === selectedStrategy);
    
    // Ensure all parameters are included with their default values and proper types
    let finalParameters = { ...strategyParams };
    if (parameterMode === 'manual' && currentStrategyData) {
      // Make sure all required parameters are included, even if not modified by user
      currentStrategyData.parameters.forEach(param => {
        if (!(param.name in finalParameters)) {
          finalParameters[param.name] = param.defaultValue;
        }
        // FORCE all numeric parameters to be floats - very aggressive conversion
        if (param.type === 'number') {
          const value = finalParameters[param.name];
          if (value !== null && value !== undefined && value !== '') {
            finalParameters[param.name] = Number.parseFloat(String(value));
            // Ensure it's a valid number
            if (isNaN(finalParameters[param.name])) {
              finalParameters[param.name] = Number.parseFloat(String(param.defaultValue));
            }
          } else {
            finalParameters[param.name] = Number.parseFloat(String(param.defaultValue));
          }
        }
      });
    }
    
    // Transform to our API's BacktestRequest format
    const backtestConfig = {
      strategy: selectedStrategy,
      symbols: selectedTickers,
      start_date: startDate,
      end_date: endDate,
      initial_capital: parseInt(capital),
      parameters: parameterMode === 'manual' ? finalParameters : undefined,
      compare_with_spy: true,
      parameter_mode: parameterMode === 'optimize' ? 'optimized' : 'fixed',
      regime_parameters: walkForwardConfig.enabled ? {
        window_size: walkForwardConfig.windowSize,
        step_size: walkForwardConfig.stepSize,
        optimization_period: walkForwardConfig.optimizationPeriod,
        min_trade_count: walkForwardConfig.minTradeCount
      } : undefined
    };
    
    // Server-side type conversion will handle int->float conversion
    console.log('Parameters to send:', finalParameters);

    // Ensure all parameter values are floats (for numbers) before sending to backend
    let backtestParameters = {};
    if (finalParameters && typeof finalParameters === 'object') {
      Object.entries(finalParameters).forEach(([key, value]) => {
        if (typeof value === 'number') {
          backtestParameters[key] = Number.parseFloat(value.toString());
        } else if (!isNaN(value) && value !== '' && value !== null && value !== undefined) {
          // If value is a string that can be converted to a number, convert to float
          const floatVal = Number.parseFloat(value);
          backtestParameters[key] = isNaN(floatVal) ? value : floatVal;
        } else {
          backtestParameters[key] = value;
        }
      });
    }
    console.log('Backtest parameters:', backtestParameters);
    backtestConfig.parameters = backtestParameters;
    console.log('Creating backtest with configuration:', backtestConfig);
    
    // Submit to our vector-bt backend
    submitBacktest.mutate(backtestConfig);
  };

  const resetForm = () => {
    setSelectedStrategy('');
    setSelectedTickers([]);
    setStrategyParams({});
    setCapital('100000');
    setBacktestName('');
    setTickerSearch('');
    setCurrentPage(0);
    setShowTickerDropdown(false);
    setParameterMode('manual');
    setWalkForwardConfig({
      enabled: false,
      windowSize: 252,
      stepSize: 63,
      optimizationPeriod: 504,
      minTradeCount: 50
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Create New Backtest
          </DialogTitle>
          <DialogDescription>
            Select a premade strategy, configure parameters, and choose tickers for backtesting
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Backtest Name */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Backtest Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="backtest-name" className="text-sm font-medium">
                  Backtest Name
                </Label>
                <Input
                  id="backtest-name"
                  value={backtestName}
                  onChange={(e) => setBacktestName(e.target.value)}
                  placeholder="Enter backtest name..."
                  className="mt-1"
                />
              </div>
              
              <div className="flex items-center gap-4">
                <Label htmlFor="capital" className="text-sm font-medium">
                  Initial Capital ($)
                </Label>
                <Input
                  id="capital"
                  type="number"
                  value={capital}
                  onChange={(e) => setCapital(e.target.value)}
                  className="w-32"
                  min="10000"
                  step="10000"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCapital('50000')}
                    className={capital === '50000' ? 'border-primary' : ''}
                  >
                    $50K
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCapital('100000')}
                    className={capital === '100000' ? 'border-primary' : ''}
                  >
                    $100K
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCapital('500000')}
                    className={capital === '500000' ? 'border-primary' : ''}
                  >
                    $500K
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Strategy Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Strategy Selection</CardTitle>
              <CardDescription>
                Choose from our validated trading strategies
                {selectedStrategy && (
                  <Badge variant="secondary" className="ml-2">
                    {currentStrategy?.name}
                  </Badge>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingStrategies ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading strategies...</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableStrategies.map((strategy) => {
                  const isSelected = selectedStrategy === strategy.id;
                  
                  return (
                    <Card 
                      key={strategy.id} 
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-accent/50'
                      }`}
                      onClick={() => handleStrategySelect(strategy.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-1">{strategy.icon}</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{strategy.name}</h4>
                              <Badge variant="outline" className="text-xs">
                                {strategy.category}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{strategy.description}</p>
                            <div className="mt-2 flex gap-1">
                              {strategy.defaultTickers.slice(0, 3).map(ticker => (
                                <Badge key={ticker} variant="secondary" className="text-xs">
                                  {ticker}
                                </Badge>
                              ))}
                              {strategy.defaultTickers.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{strategy.defaultTickers.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ticker Selection */}
          {selectedStrategy && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ticker Selection</CardTitle>
                <CardDescription>
                  Choose which tickers to include in the backtest
                  <Badge variant="secondary" className="ml-2">
                    {selectedTickers.length} selected
                  </Badge>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Selected Tickers Display */}
                  {selectedTickers.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Selected Tickers</Label>
                      <div className="flex flex-wrap gap-2">
                        {selectedTickers.map((tickerSymbol) => {
                          const ticker = tickerOptions.find(t => t.symbol === tickerSymbol);
                          const isDefault = currentStrategy?.defaultTickers.includes(tickerSymbol);
                          
                          return (
                            <Badge
                              key={tickerSymbol}
                              variant="secondary"
                              className={`flex items-center gap-1 ${isDefault ? 'border-primary' : ''}`}
                            >
                              {tickerSymbol}
                              {isDefault && <Target className="w-3 h-3" />}
                              <button
                                onClick={() => handleTickerRemove(tickerSymbol)}
                                className="ml-1 hover:bg-destructive/20 rounded-full"
                              >
                                ×
                              </button>
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Ticker Dropdown */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Add Tickers</Label>
                    <div className="relative">
                      <Input
                        placeholder="Search tickers by symbol, name, or sector..."
                        value={tickerSearch}
                        onChange={(e) => {
                          setTickerSearch(e.target.value);
                          setCurrentPage(0);
                          setShowTickerDropdown(true);
                        }}
                        onFocus={() => setShowTickerDropdown(true)}
                        onBlur={() => {
                          // Delay hiding to allow clicks on dropdown items
                          setTimeout(() => setShowTickerDropdown(false), 200);
                        }}
                        className="pr-10"
                      />
                      
                      {showTickerDropdown && (
                        <>
                          {/* Backdrop overlay */}
                          <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setShowTickerDropdown(false)}
                          />
                          <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-80 overflow-hidden bg-background border border-border shadow-lg">
                            <CardContent className="p-0">
                              <ScrollArea className="h-64">
                              <div className="p-2 space-y-1">
                                {paginatedTickers.length === 0 ? (
                                  <div className="text-center text-muted-foreground py-4">
                                    No tickers found
                                  </div>
                                ) : (
                                  paginatedTickers.map((tickerItem) => {
                                    const isSelected = selectedTickers.includes(tickerItem.symbol);
                                    
                                    return (
                                      <div
                                        key={tickerItem.symbol}
                                        className={`p-3 rounded cursor-pointer hover:bg-accent transition-colors ${
                                          isSelected ? 'bg-primary/10 border border-primary/20' : ''
                                        }`}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          if (!isSelected) {
                                            handleTickerAdd(tickerItem.symbol);
                                          }
                                        }}
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                              <span className="font-medium text-sm">{tickerItem.symbol}</span>
                                              <Badge variant="outline" className="text-xs">
                                                {tickerItem.exchange}
                                              </Badge>
                                              {isSelected && (
                                                <Badge variant="secondary" className="text-xs">
                                                  Selected
                                                </Badge>
                                              )}
                                            </div>
                                            <div className="text-xs font-medium text-muted-foreground mb-1">
                                              {tickerItem.name}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                              {tickerItem.sector}
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            <div className="text-sm font-medium">
                                              ${tickerItem.price.toFixed(2)}
                                            </div>
                                            <div className={`text-xs ${
                                              tickerItem.change >= 0 ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                              {tickerItem.change >= 0 ? '+' : ''}{tickerItem.change.toFixed(2)} 
                                              ({tickerItem.changePercent >= 0 ? '+' : ''}{tickerItem.changePercent.toFixed(2)}%)
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </ScrollArea>
                            
                            {/* Pagination */}
                            {totalPages > 1 && (
                              <div className="border-t p-2 flex items-center justify-between">
                                <div className="text-xs text-muted-foreground">
                                  Page {currentPage + 1} of {totalPages} ({filteredTickers.length} results)
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setCurrentPage(Math.max(0, currentPage - 1));
                                    }}
                                    disabled={currentPage === 0}
                                    className="h-6 px-2"
                                  >
                                    Prev
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setCurrentPage(Math.min(totalPages - 1, currentPage + 1));
                                    }}
                                    disabled={currentPage === totalPages - 1}
                                    className="h-6 px-2"
                                  >
                                    Next
                                  </Button>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                        </>
                      )}
                      
                      
                  </div>
                </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Strategy Parameters */}
          {selectedStrategy && currentStrategy && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Strategy Parameters</CardTitle>
                <CardDescription>
                  Configure strategy parameters for optimal performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Parameter Mode Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Parameter Configuration</Label>
                  <div className="flex gap-3">
                    <Button
                      variant={parameterMode === 'manual' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setParameterMode('manual')}
                      className="flex items-center gap-2"
                    >
                      <Target className="w-4 h-4" />
                      Manual Parameters
                    </Button>
                    <Button
                      variant={parameterMode === 'optimize' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setParameterMode('optimize')}
                      className="flex items-center gap-2"
                    >
                      <Brain className="w-4 h-4" />
                      Optimize Parameters
                    </Button>
                  </div>
                  
                  {parameterMode === 'optimize' && (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-primary">Parameter Optimization Enabled</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        The backtest will automatically find the best parameter combination using optimization algorithms.
                        Results will show both default and optimized performance metrics.
                      </p>
                    </div>
                  )}
                </div>

                {/* Walk Forward Optimization */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Walk Forward Optimization</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="walkforward-enabled"
                        checked={walkForwardConfig.enabled}
                        onCheckedChange={(checked) => 
                          setWalkForwardConfig(prev => ({ ...prev, enabled: !!checked }))
                        }
                      />
                      <Label htmlFor="walkforward-enabled" className="text-sm">
                        Enable
                      </Label>
                    </div>
                  </div>
                  
                  {walkForwardConfig.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-accent/30 rounded-lg">
                      <div className="space-y-2">
                        <Label htmlFor="window-size" className="text-xs font-medium">
                          Training Window (days)
                        </Label>
                        <Input
                          id="window-size"
                          type="number"
                          value={walkForwardConfig.windowSize}
                          onChange={(e) => setWalkForwardConfig(prev => ({
                            ...prev,
                            windowSize: parseInt(e.target.value) || 252
                          }))}
                          min="30"
                          max="1260"
                          className="h-8"
                        />
                        <p className="text-xs text-muted-foreground">Data period for training</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="step-size" className="text-xs font-medium">
                          Step Size (days)
                        </Label>
                        <Input
                          id="step-size"
                          type="number"
                          value={walkForwardConfig.stepSize}
                          onChange={(e) => setWalkForwardConfig(prev => ({
                            ...prev,
                            stepSize: parseInt(e.target.value) || 63
                          }))}
                          min="1"
                          max="252"
                          className="h-8"
                        />
                        <p className="text-xs text-muted-foreground">Forward step interval</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="optimization-period" className="text-xs font-medium">
                          Optimization Period (days)
                        </Label>
                        <Input
                          id="optimization-period"
                          type="number"
                          value={walkForwardConfig.optimizationPeriod}
                          onChange={(e) => setWalkForwardConfig(prev => ({
                            ...prev,
                            optimizationPeriod: parseInt(e.target.value) || 504
                          }))}
                          min="60"
                          max="2520"
                          className="h-8"
                        />
                        <p className="text-xs text-muted-foreground">Period for parameter optimization</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="min-trades" className="text-xs font-medium">
                          Min Trade Count
                        </Label>
                        <Input
                          id="min-trades"
                          type="number"
                          value={walkForwardConfig.minTradeCount}
                          onChange={(e) => setWalkForwardConfig(prev => ({
                            ...prev,
                            minTradeCount: parseInt(e.target.value) || 50
                          }))}
                          min="10"
                          max="1000"
                          className="h-8"
                        />
                        <p className="text-xs text-muted-foreground">Minimum trades required</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Parameter Controls - Only show when manual mode */}
                {parameterMode === 'manual' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currentStrategy.parameters.map((param: any) => (
                      <div key={param.name} className="space-y-2">
                        <Label htmlFor={param.name} className="text-sm font-medium">
                          {param.label}
                        </Label>
                        {param.description && (
                          <p className="text-xs text-muted-foreground">{param.description}</p>
                        )}
                        
                        {param.type === 'select' ? (
                          <Select
                            value={strategyParams[param.name]?.toString() || param.defaultValue.toString()}
                            onValueChange={(value) => handleParameterChange(param.name, value)}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-background border border-border shadow-lg z-50">
                              {param.options?.map((option: any) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : param.type === 'boolean' ? (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={param.name}
                              checked={strategyParams[param.name] ?? param.defaultValue}
                              onCheckedChange={(checked) => handleParameterChange(param.name, checked)}
                            />
                            <Label htmlFor={param.name} className="text-sm">
                              Enable
                            </Label>
                          </div>
                        ) : (
                          <Input
                            id={param.name}
                            type="number"
                            value={strategyParams[param.name] ?? param.defaultValue}
                            onChange={(e) => handleParameterChange(
                              param.name,
                              e.target.value
                            )}
                            min={param.min}
                            max={param.max}
                            step={param.step || 0.01}
                            className="h-8"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Optimization Summary - Show when optimize mode */}
                {parameterMode === 'optimize' && (
                  <div className="bg-accent/30 rounded-lg p-4">
                    <h4 className="font-medium mb-2">Parameter Optimization Summary</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Parameters:</span>
                        <div className="font-medium">{currentStrategy.parameters.length} total</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Optimization:</span>
                        <div className="font-medium">Grid Search</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Metric:</span>
                        <div className="font-medium">Sharpe Ratio</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Combinations:</span>
                        <div className="font-medium">~1,000</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { onOpenChange(false); resetForm(); }}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateBacktest}
            disabled={!selectedStrategy || selectedTickers.length === 0 || submitBacktest.isPending}
          >
            {submitBacktest.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Create Backtest'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};