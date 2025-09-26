import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface RemoveFromWatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: {
    id: number;
    symbol: string;
    name: string;
    exchange?: string;
  };
}

export const RemoveFromWatchModal: React.FC<RemoveFromWatchModalProps> = ({
  isOpen,
  onClose,
  symbol
}) => {
  const [selectedRemoveStrategyId, setSelectedRemoveStrategyId] = useState('');
  const { toast } = useToast();

  // Query to fetch ticker strategies
  const { data: tickerStrategiesData, isLoading: isTickerStrategiesLoading } = useQuery({
    queryKey: ['ticker-strategies', symbol?.id],
    queryFn: async () => {
      if (!symbol?.id) return [];
      
      try {
        const response = await fetch(`/api/symbols/${symbol.id}/strategies`);
        if (!response.ok) throw new Error('Failed to fetch ticker strategies');
        const data = await response.json();
        return data.data.strategies || [];
      } catch (error) {
        console.log('No ticker strategies data available:', error);
        return [];
      }
    },
    enabled: !!symbol?.id && isOpen,
    retry: false,
  });

  const handleSubmit = async () => {
    if (!symbol || !selectedRemoveStrategyId || 
        selectedRemoveStrategyId === 'loading' || selectedRemoveStrategyId === 'no-strategies') {
      return;
    }
    
    console.log('Removing symbol from watch list:', symbol.id, selectedRemoveStrategyId);
    
    try {
      const response = await fetch(`/api/symbols/${symbol.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          strategyId: parseInt(selectedRemoveStrategyId),
          allocatedCapital: 1, // Not used for removal
        }),
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        // Success toast
        toast({
          title: "Symbol Removed from Watch List",
          description: `${symbol.symbol} has been successfully removed from the selected strategy.`,
        });
        
        // Close modal and reset form
        setSelectedRemoveStrategyId('');
        onClose();
        
        // Refresh the symbols data
        window.location.reload(); // Quick refresh for now
      } else {
        // Error toast
        const errorMessage = result.error?.message || 'Unknown error occurred';
        toast({
          title: "Failed to Remove Symbol",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error removing symbol from watch list:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetAndClose = () => {
    setSelectedRemoveStrategyId('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Remove from Watch List</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {symbol && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg">{symbol.symbol}</h3>
                <Badge variant="outline">{symbol.exchange || 'Unknown'}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {symbol.name || 'No company name available'}
              </p>
            </div>
          )}
          <div className="space-y-2">
            <label htmlFor="removeStrategy" className="text-sm font-medium">
              Select Strategy to Remove
            </label>
            <Select value={selectedRemoveStrategyId} onValueChange={setSelectedRemoveStrategyId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a strategy to remove" />
              </SelectTrigger>
              <SelectContent>
                {isTickerStrategiesLoading ? (
                  <SelectItem value="loading" disabled>Loading strategies...</SelectItem>
                ) : tickerStrategiesData?.length > 0 ? (
                  tickerStrategiesData.map((strategy: any) => (
                    <SelectItem key={strategy.id} value={strategy.id.toString()}>
                      {strategy.name} (${strategy.allocation?.allocated_capital || 0} allocated)
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-strategies" disabled>No strategies found for this symbol</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              This will deactivate the strategy allocation for this symbol.
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button 
              variant="outline" 
              onClick={resetAndClose}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleSubmit}
              disabled={!selectedRemoveStrategyId || selectedRemoveStrategyId === 'loading' || selectedRemoveStrategyId === 'no-strategies'}
            >
              Remove from Watch List
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};