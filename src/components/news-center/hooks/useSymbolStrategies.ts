import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Strategy {
  id: number;
  name: string;
  processed_by_rust: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  allocation: {
    id: number;
    allocated_capital: string;
    used_capital: string;
    available_capital: string;
    current_position: string;
    realized_pnl: string;
    unrealized_pnl: string;
  };
}

interface SymbolStrategiesResponse {
  strategies: Strategy[];
  symbol_id: number;
  total: number;
}

export const useSymbolStrategies = (symbolId: number) => {
  return useQuery<SymbolStrategiesResponse>({
    queryKey: ["symbol-strategies", symbolId],
    queryFn: async () => {
      const response = await fetch(`/api/symbols/${symbolId}/strategies?is_active=true&processed_by_rust=false`);
      if (!response.ok) {
        throw new Error("Failed to fetch symbol strategies");
      }
      const result = await response.json();
      return result.data;
    },
    enabled: !!symbolId,
  });
};

export const useToggleSymbolWatch = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ symbolId, strategyId, allocatedCapital }: {
      symbolId: number;
      strategyId: number;
      allocatedCapital: number;
    }) => {
      const response = await fetch(`/api/symbols/${symbolId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          strategyId,
          allocatedCapital,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to toggle symbol watch");
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch ticker data
      queryClient.invalidateQueries({ queryKey: ["symbols"] });
      queryClient.invalidateQueries({ queryKey: ["symbol-strategies"] });
    },
  });
};