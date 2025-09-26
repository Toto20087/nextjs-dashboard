'use client';

import React, { useMemo, useState, useEffect } from 'react';
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
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ScrollArea } from '../ui/scroll-area';
import { BarChart3, Activity, Target, Brain, Loader2 } from 'lucide-react';
import { apiService, vectorBtService } from '../../services/api';
import { useToast } from '../ui/use-toast';

// Date formatting utility
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};


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
  const [positionSizing, setPositionSizing] = useState<string>('0.03');
  const [backtestName, setBacktestName] = useState<string>('');
  const [tickerSearch, setTickerSearch] = useState<string>('');
  const [debouncedTickerSearch, setDebouncedTickerSearch] = useState<string>('');
  const [showTickerDropdown, setShowTickerDropdown] = useState<boolean>(false);
  const [parameterMode, setParameterMode] = useState<'manual' | 'optimize'>('manual');
  const [startDate, setStartDate] = useState<Date>(new Date('2024-01-01'));
  const [endDate, setEndDate] = useState<Date>(new Date('2024-12-31'));
  const [walkForwardConfig, setWalkForwardConfig] = useState({
    training_window: 30,
    step_size: 7,
    optimization_period: 7,
    min_trade_count: 10
  });

  // Optimization parameters for each symbol
  const [optimizationParameters, setOptimizationParameters] = useState<Record<string, Record<string, { min: number; max: number; step: number }>>>({});

  // Fetch available strategies from vector-bt
  const { data: vectorBtStrategies, isLoading: isLoadingStrategies } = useQuery({
    queryKey: ['vector-bt-strategies'],
    queryFn: async () => {
      const response = await vectorBtService.strategies.getAvailable();
      return response.data;
    },
    retry: 2,
  });

  const { data: activeStrategies } = useQuery({
    queryKey: ['active-strategies'],
    queryFn: async () => {
      const response = await apiService.strategies.getActive();
      return response.data;
    },
  });

  // Create comparison array with strategies that exist in both responses
  const commonStrategies = useMemo(() => {
    if (!vectorBtStrategies?.data?.strategies || !activeStrategies?.data?.strategies) {
      return [];
    }

    // Create a Set of active strategy IDs for faster lookup
    const activeStrategyIds = new Set(
      activeStrategies.data.strategies.map((strategy: any) => strategy.id)
    );

    // Filter vectorBt strategies to only include those that are also in activeStrategies
    return vectorBtStrategies.data.strategies.filter((strategy: any) => 
      activeStrategyIds.has(strategy.id)
    );
  }, [vectorBtStrategies, activeStrategies]);

  // Debounce ticker search to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTickerSearch(tickerSearch);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [tickerSearch]);

  // Fetch active symbols with pagination support
  const [symbolsPage, setSymbolsPage] = useState(1);
  const [allActiveSymbols, setAllActiveSymbols] = useState<any[]>([]);
  
  const {data: activeSymbols, isLoading: isLoadingSymbols} = useQuery({
    queryKey: ['active-symbols', symbolsPage, debouncedTickerSearch],
    queryFn: async () => {
      let url = `/api/symbols?status=active&page=${symbolsPage}&limit=50`;
      if (debouncedTickerSearch) {
        url += `&search=${debouncedTickerSearch}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch symbols');
      }
      const result = await response.json();
      return result.data;
    },
    enabled: open, // Only fetch when modal is open
  });

  // Accumulate symbols when new pages are loaded
  React.useEffect(() => {
    if (activeSymbols?.symbols) {
      if (symbolsPage === 1 || debouncedTickerSearch) {
        // Reset symbols for first page or when searching
        setAllActiveSymbols(activeSymbols.symbols);
      } else {
        // Append symbols for subsequent pages
        setAllActiveSymbols(prev => [...prev, ...activeSymbols.symbols]);
      }
    }
  }, [activeSymbols, symbolsPage, debouncedTickerSearch]);

  // Reset page when search changes
  React.useEffect(() => {
    setSymbolsPage(1);
  }, [debouncedTickerSearch]);

  const getStrategyParameters = async (strategyId: string) => {
    const response = await apiService.strategies.getConfigParameters(strategyId);
    return response.data;
  };

  // Use real strategy data - prioritize commonStrategies, fallback to vectorBtStrategies
  const availableStrategies: Strategy[] = React.useMemo(() => {
    // Prioritize strategies that are in both systems (commonStrategies)
    let strategiesToUse = commonStrategies;
    
    // Fallback to vectorBtStrategies if commonStrategies is empty
    if (strategiesToUse.length === 0 && vectorBtStrategies?.data?.strategies) {
      strategiesToUse = vectorBtStrategies.data.strategies;
    }

    return strategiesToUse.map((strategy: any) => ({
      id: strategy.id.toString(),
      name: strategy.name,
      description: strategy.description || `${strategy.name} trading strategy`,
      category: strategy.processed_by_rust ? 'Algorithmic' : 'Manual',
      icon: <Activity className="w-4 h-4" />,
      defaultTickers: [],
      parameters: []
    }));
  }, [commonStrategies, vectorBtStrategies]);

  // Fetch dynamic parameters for selected strategy
  const { data: strategyParameters, isLoading: isLoadingParameters } = useQuery({
    queryKey: ['strategy-parameters', selectedStrategy],
    queryFn: async () => {
      if (!selectedStrategy) return null;
      return await getStrategyParameters(selectedStrategy);
    },
    enabled: !!selectedStrategy,
    retry: 1,
  });

  // Transform dynamic parameters into the Strategy parameter format
  const currentStrategy = React.useMemo(() => {
    const baseStrategy = availableStrategies.find(s => s.id === selectedStrategy);
    
    if (!baseStrategy || !strategyParameters?.data?.parameters) {
      return baseStrategy;
    }

    // Transform API parameters to Strategy parameter format
    const transformedParameters = Object.entries(strategyParameters.data.parameters).map(([key, param]) => {
      const paramType = param === 'int' || param === 'float' ? 'number' as const : 
                       param === 'bool' ? 'boolean' as const : 'number' as const;
      
      const defaultValue = param === 'int' ? 0 : 
                          param === 'float' ? 0.0 : 
                          param === 'bool' ? false : 0.0;

      return {
        name: key,
        label: key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        type: paramType,
        defaultValue,
        min: undefined,
        max: undefined,
        step: param === 'int' ? 1 : 0.01,
        options: undefined,
        description: undefined,
      };
    });

    return {
      ...baseStrategy,
      parameters: transformedParameters
    };
  }, [availableStrategies, selectedStrategy, strategyParameters]);


  // Submit backtest mutation
  const submitBacktest = useMutation({
    mutationFn: async (backtestConfig: any) => {
      const response = await vectorBtService.backtests.runBacktest(backtestConfig);
      return response.data;
    },
    onSuccess: (data) => {
      
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
  
  // Use accumulated symbol data for ticker selection
  const availableTickerData = allActiveSymbols;

  // Function to load more symbols when reaching the end
  const loadMoreSymbols = () => {
    if (activeSymbols?.pagination?.hasNext && !isLoadingSymbols) {
      setSymbolsPage(prev => prev + 1);
    }
  };

  const handleStrategySelect = (strategyId: string) => {
    const strategy = availableStrategies.find(s => s.id === strategyId);
    if (strategy) {
      setSelectedStrategy(strategyId);
      setSelectedTickers(strategy.defaultTickers);
      
      setStrategyParams({});
      
      setBacktestName(`${strategy.name} - ${new Date().toLocaleDateString()}`);
      
    }
  };

  // Initialize parameters when strategy parameters are loaded
  React.useEffect(() => {
    if (currentStrategy?.parameters && selectedStrategy) {
      const defaultParams: Record<string, any> = {};
      currentStrategy.parameters.forEach(param => {
        // FORCE all numeric parameters to be floats with explicit conversion
        if (param.type === 'number') {
          // Use Number constructor to ensure proper float conversion
          defaultParams[param.name] = Number(param.defaultValue);
        } else {
          defaultParams[param.name] = param.defaultValue;
        }
      });
      setStrategyParams(defaultParams);
      
    }
  }, [currentStrategy, selectedStrategy]);


  const handleTickerAdd = (tickerSymbol: string) => {
    if (!selectedTickers.includes(tickerSymbol)) {
      setSelectedTickers(prev => [...prev, tickerSymbol]);
    }
    setShowTickerDropdown(false);
    setTickerSearch('');
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
    // Validate required fields based on parameter mode
    if (parameterMode === 'manual' && (!startDate || !endDate)) {
      toast({
        title: "Missing Date Range",
        description: "Start date and end date are required for manual parameter mode.",
        variant: "destructive",
      });
      return;
    }

    // Ensure all parameters are included with their default values and proper types
    const finalParameters = { ...strategyParams };
    console.log("finalParameters:", finalParameters);
    if (parameterMode === 'manual' && currentStrategy) {
      // Make sure all required parameters are included, even if not modified by user
      currentStrategy.parameters.forEach(param => {
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
    
    
    // Transform to API format based on parameter mode
    const backtestConfig = {
      strategy: selectedStrategy,
      symbols: selectedTickers,
      startDate: parameterMode === 'manual' ? formatDate(startDate) : null,
      endDate: parameterMode === 'manual' ? formatDate(endDate) : null,
      initialCapital: parseInt(capital),
      position_sizing: parseFloat(positionSizing),
      parameters: parameterMode === 'manual' ? finalParameters : optimizationParameters,
      walkForwardConfig: parameterMode === 'optimize' ? {
        enabled: true,
        ...walkForwardConfig
      } : null,
      optimizeConfig: parameterMode === 'optimize'
    };

    // Debug: Log the parameters being sent
    console.log('Frontend sending parameters:', JSON.stringify(backtestConfig.parameters, null, 2));
  
    console.log("backtestConfig:", backtestConfig);
    
    // Only process finalParameters for manual mode
    if (parameterMode === 'manual') {
      // Ensure all parameter values are floats (for numbers) before sending to backend
      const backtestParameters: Record<string, any> = {};
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
      backtestConfig.parameters = backtestParameters;
    }
    // For optimization mode, keep the original optimizationParameters structure
    
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
    setShowTickerDropdown(false);
    setParameterMode('manual');
    setStartDate(new Date('2024-01-01'));
    setEndDate(new Date('2024-12-31'));
    setSymbolsPage(1);
    setAllActiveSymbols([]);
    setWalkForwardConfig({
      training_window: 30,
      step_size: 7,
      optimization_period: 7,
      min_trade_count: 10
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>
                
                <div className="flex items-center gap-4">
                  <Label htmlFor="position-sizing" className="text-sm font-medium">
                    Position Sizing
                  </Label>
                  <Input
                    id="position-sizing"
                    type="number"
                    value={positionSizing}
                    onChange={(e) => setPositionSizing(e.target.value)}
                    className="w-32"
                    min="0.01"
                    max="1.0"
                    step="0.01"
                    placeholder="0.03"
                  />
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
                                {isLoadingSymbols && availableTickerData.length === 0 ? (
                                  <div className="text-center text-muted-foreground py-4">
                                    <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
                                    Loading tickers...
                                  </div>
                                ) : availableTickerData.length === 0 ? (
                                  <div className="text-center text-muted-foreground py-4">
                                    No tickers found
                                  </div>
                                ) : (
                                  <>
                                    {availableTickerData.map((tickerItem: any) => {
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
                                                  {tickerItem.exchange || 'Unknown'}
                                                </Badge>
                                                {isSelected && (
                                                  <Badge variant="secondary" className="text-xs">
                                                    Selected
                                                  </Badge>
                                                )}
                                              </div>
                                              <div className="text-xs font-medium text-muted-foreground mb-1">
                                                {tickerItem.name || tickerItem.symbol}
                                              </div>
                                              <div className="text-xs text-muted-foreground">
                                                {tickerItem.sector || 'N/A'}
                                              </div>
                                            </div>
                                            <div className="text-right">
                                              {tickerItem.price ? (
                                                <div className="text-sm font-medium">
                                                  ${tickerItem.price.toFixed(2)}
                                                </div>
                                              ) : (
                                                <div className="text-sm text-muted-foreground">
                                                  N/A
                                                </div>
                                              )}
                                              {tickerItem.change && tickerItem.changePercent ? (
                                                <div className={`text-xs ${
                                                  tickerItem.change >= 0 ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                  {tickerItem.change >= 0 ? '+' : ''}{tickerItem.change.toFixed(2)} 
                                                  ({tickerItem.changePercent >= 0 ? '+' : ''}{tickerItem.changePercent.toFixed(2)}%)
                                                </div>
                                              ) : (
                                                <div className="text-xs text-muted-foreground">
                                                  No price data
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                    
                                    {/* Load More Button */}
                                    {activeSymbols?.pagination?.hasNext && (
                                      <div className="text-center py-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            loadMoreSymbols();
                                          }}
                                          disabled={isLoadingSymbols}
                                          className="w-full"
                                        >
                                          {isLoadingSymbols ? (
                                            <>
                                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                              Loading...
                                            </>
                                          ) : (
                                            'Load More'
                                          )}
                                        </Button>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </ScrollArea>
                            
                            {/* Status info */}
                            {availableTickerData.length > 0 && (
                              <div className="border-t p-2 text-center">
                                <div className="text-xs text-muted-foreground">
                                  Showing {availableTickerData.length} tickers
                                  {activeSymbols?.pagination?.hasNext && ' (more available)'}
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

                {/* Walk Forward Optimization - Only show when optimize parameters is selected */}
                {parameterMode === 'optimize' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Walk Forward Configuration</Label>
                      <Badge variant="secondary" className="text-xs">
                        Required for optimization
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-accent/30 rounded-lg">
                      <div className="space-y-2">
                        <Label htmlFor="training-window" className="text-xs font-medium">
                          Training Window (days)
                        </Label>
                        <Input
                          id="training-window"
                          type="number"
                          value={walkForwardConfig.training_window}
                          onChange={(e) => setWalkForwardConfig(prev => ({
                            ...prev,
                            training_window: parseInt(e.target.value) || 30
                          }))}
                          min="10"
                          max="365"
                          className="h-8"
                        />
                        <p className="text-xs text-muted-foreground">Training period for optimization</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="step-size" className="text-xs font-medium">
                          Step Size (days)
                        </Label>
                        <Input
                          id="step-size"
                          type="number"
                          value={walkForwardConfig.step_size}
                          onChange={(e) => setWalkForwardConfig(prev => ({
                            ...prev,
                            step_size: parseInt(e.target.value) || 7
                          }))}
                          min="1"
                          max="30"
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
                          value={walkForwardConfig.optimization_period}
                          onChange={(e) => setWalkForwardConfig(prev => ({
                            ...prev,
                            optimization_period: parseInt(e.target.value) || 7
                          }))}
                          min="1"
                          max="30"
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
                          value={walkForwardConfig.min_trade_count}
                          onChange={(e) => setWalkForwardConfig(prev => ({
                            ...prev,
                            min_trade_count: parseInt(e.target.value) || 10
                          }))}
                          min="1"
                          max="100"
                          className="h-8"
                        />
                        <p className="text-xs text-muted-foreground">Minimum trades required</p>
                      </div>
                    </div>

                    {/* Optimization Parameters for each symbol */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Optimization Parameters by Symbol</Label>
                      <div className="space-y-4">
                        {selectedTickers.map((symbol) => (
                          <Card key={symbol} className="border-dashed">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium">{symbol} Parameters</CardTitle>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setOptimizationParameters(prev => ({
                                      ...prev,
                                      [symbol]: {
                                        rsi_period: { min: 10, max: 20, step: 5 },
                                        rsi_oversold: { min: 20, max: 30, step: 5 },
                                        rsi_overbought: { min: 70, max: 80, step: 5 },
                                        vwap_deviation: { min: 0.01, max: 0.05, step: 0.02 }
                                      }
                                    }));
                                  }}
                                >
                                  Set Defaults
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              {optimizationParameters[symbol] ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {Object.entries(optimizationParameters[symbol]).map(([paramName, paramConfig]) => (
                                    <div key={paramName} className="space-y-2 p-3 bg-muted/50 rounded-lg">
                                      <Label className="text-xs font-medium capitalize">
                                        {paramName.replace(/_/g, ' ')}
                                      </Label>
                                      <div className="grid grid-cols-3 gap-2">
                                        <div>
                                          <Label className="text-xs text-muted-foreground">Min</Label>
                                          <Input
                                            type="number"
                                            step="0.001"
                                            value={paramConfig.min}
                                            onChange={(e) => {
                                              const value = parseFloat(e.target.value) || 0;
                                              setOptimizationParameters(prev => ({
                                                ...prev,
                                                [symbol]: {
                                                  ...prev[symbol],
                                                  [paramName]: { ...paramConfig, min: value }
                                                }
                                              }));
                                            }}
                                            className="h-8 text-xs"
                                          />
                                        </div>
                                        <div>
                                          <Label className="text-xs text-muted-foreground">Max</Label>
                                          <Input
                                            type="number"
                                            step="0.001"
                                            value={paramConfig.max}
                                            onChange={(e) => {
                                              const value = parseFloat(e.target.value) || 0;
                                              setOptimizationParameters(prev => ({
                                                ...prev,
                                                [symbol]: {
                                                  ...prev[symbol],
                                                  [paramName]: { ...paramConfig, max: value }
                                                }
                                              }));
                                            }}
                                            className="h-8 text-xs"
                                          />
                                        </div>
                                        <div>
                                          <Label className="text-xs text-muted-foreground">Step</Label>
                                          <Input
                                            type="number"
                                            step="0.001"
                                            value={paramConfig.step}
                                            onChange={(e) => {
                                              const value = parseFloat(e.target.value) || 0.001;
                                              setOptimizationParameters(prev => ({
                                                ...prev,
                                                [symbol]: {
                                                  ...prev[symbol],
                                                  [paramName]: { ...paramConfig, step: value }
                                                }
                                              }));
                                            }}
                                            className="h-8 text-xs"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-6 text-muted-foreground">
                                  <p className="text-sm">Click Set Defaults button to configure optimization parameters for {symbol}</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Parameter Controls - Only show when manual mode */}
                {parameterMode === 'manual' && (
                  <div className="space-y-4">
                    {isLoadingParameters ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm text-muted-foreground">Loading strategy parameters...</span>
                        </div>
                      </div>
                    ) : currentStrategy?.parameters && currentStrategy.parameters.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {currentStrategy.parameters.map((param) => (
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
                              {param.options?.map((option: string) => (
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
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        {selectedStrategy ? 'No parameters configured for this strategy' : 'Select a strategy to configure parameters'}
                      </div>
                    )}
                  </div>
                )}

                {/* Date Range Selection - Only show when manual parameters mode and parameters are loaded */}
                {parameterMode === 'manual' && currentStrategy?.parameters && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Date Range</CardTitle>
                      <CardDescription>
                        Select the start and end dates for your backtest
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="startDate" className="text-sm font-medium">
                            Start Date
                          </Label>
                          <Input
                            id="startDate"
                            type="date"
                            value={startDate.toISOString().split('T')[0]}
                            onChange={(e) => setStartDate(new Date(e.target.value))}
                            className="h-8"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="endDate" className="text-sm font-medium">
                            End Date
                          </Label>
                          <Input
                            id="endDate"
                            type="date"
                            value={endDate.toISOString().split('T')[0]}
                            onChange={(e) => setEndDate(new Date(e.target.value))}
                            className="h-8"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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