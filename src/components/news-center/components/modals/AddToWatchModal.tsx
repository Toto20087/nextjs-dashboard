import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface AddToWatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: {
    id: number;
    symbol: string;
    name: string;
    exchange?: string;
  };
}

export const AddToWatchModal: React.FC<AddToWatchModalProps> = ({
  isOpen,
  onClose,
  symbol
}) => {
  const [selectedStrategyId, setSelectedStrategyId] = useState('');
  const [allocatedCapital, setAllocatedCapital] = useState('');
  const { toast } = useToast();

  // Query to fetch available strategies
  const { data: strategiesData, isLoading: isStrategiesLoading } = useQuery({
    queryKey: ['strategies'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/strategies?is_active=true&processed_by_rust=false');
        if (!response.ok) throw new Error('Failed to fetch strategies');
        const data = await response.json();
        return data.data.strategies || [];
      } catch (error) {
        console.log('No strategies data available:', error);
        return [];
      }
    },
    enabled: isOpen,
    retry: false,
  });

  const handleSubmit = async () => {
    if (!selectedStrategyId || !allocatedCapital || !symbol || 
        selectedStrategyId === 'loading' || selectedStrategyId === 'no-strategies') {
      console.error('Missing required fields');
      return;
    }
    
    try {
      const response = await fetch(`/api/symbols/${symbol.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          strategyId: parseInt(selectedStrategyId),
          allocatedCapital: parseFloat(allocatedCapital),
        }),
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        // Success toast with details
        toast({
          title: "Symbol Added to Watch List",
          description: `${symbol.symbol} successfully added with $${allocatedCapital} allocated capital.`,
        });
        
        // Close modal and reset form
        setSelectedStrategyId('');
        setAllocatedCapital('');
        onClose();
        
        // Refresh the symbols data
        window.location.reload(); // Quick refresh for now
      } else {
        // Error toast with specific error message
        const errorMessage = result.error?.message || 'Unknown error occurred';
        toast({
          title: "Failed to Add Symbol",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error adding symbol to watch list:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetAndClose = () => {
    setSelectedStrategyId('');
    setAllocatedCapital('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Symbol to Watch List</DialogTitle>
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
            <label htmlFor="strategy" className="text-sm font-medium">
              Strategy
            </label>
            <Select value={selectedStrategyId} onValueChange={setSelectedStrategyId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a strategy" />
              </SelectTrigger>
              <SelectContent>
                {isStrategiesLoading ? (
                  <SelectItem value="loading" disabled>Loading strategies...</SelectItem>
                ) : strategiesData?.length > 0 ? (
                  strategiesData.map((strategy: any) => (
                    <SelectItem key={strategy.id} value={strategy.id.toString()}>
                      {strategy.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-strategies" disabled>No active strategies found</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label htmlFor="capital" className="text-sm font-medium">
              Allocated Capital ($)
            </label>
            <Input
              id="capital"
              type="number"
              step="0.01"
              min="0"
              value={allocatedCapital}
              onChange={(e) => setAllocatedCapital(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button 
              variant="outline" 
              onClick={resetAndClose}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!selectedStrategyId || !allocatedCapital || selectedStrategyId === 'loading' || selectedStrategyId === 'no-strategies'}
            >
              Add to Watch List
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};