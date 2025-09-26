import { useQuery } from "@tanstack/react-query";

interface Symbol {
  id: number;
  symbol: string;
  name: string;
  is_watched: boolean;
  processed_by_rust: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface TickerDataResponse {
  symbols: Symbol[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const useTickerData = (
  page: number = 1,
  limit: number = 12,
  status?: string,
  search?: string
) => {
  return useQuery<TickerDataResponse>({
    queryKey: ["symbols", page, limit, status, search],
    queryFn: async () => {
      let url = `/api/symbols?page=${page}&limit=${limit}`;
      if (status) {
        url += `&status=${status}`;
      }
      if (search) {
        url += `&search=${search}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch ticker data");
      }
      const result = await response.json();
      return result.data;
    },
    refetchInterval: 30000,
  });
};
