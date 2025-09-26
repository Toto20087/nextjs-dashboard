import { useState } from "react";
import { Eye, EyeOff, Plus, Minus, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingCard } from "../ui/LoadingCard";
import { AddToWatchModal } from "../modals/AddToWatchModal";
import { RemoveFromWatchModal } from "../modals/RemoveFromWatchModal";
import { SymbolDetailsModal } from "../modals/SymbolDetailsModal";
import { useTickerData } from "../../hooks/useTickerData";

const FILTER_OPTIONS = [
  { value: "watched", label: "Watched Tickers" },
  { value: "active", label: "Active Tickers" },
  { value: "inactive", label: "Inactive Tickers" },
];

interface Symbol {
  id: number;
  symbol: string;
  name: string;
  exchange?: string;
  is_watched: boolean;
  processed_by_rust: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const TickersTab: React.FC = () => {
  const [tickersSearch, setTickersSearch] = useState("");
  const [tickersFilter, setTickersFilter] = useState("watched");
  const [tickersPage, setTickersPage] = useState(1);
  const [selectedTicker, setSelectedTicker] = useState<Symbol | null>(null);
  const [tickerToRemove, setTickerToRemove] = useState<Symbol | null>(null);
  const [selectedSymbolForDetails, setSelectedSymbolForDetails] = useState<Symbol | null>(null);
  const [isWatchModalOpen, setIsWatchModalOpen] = useState(false);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [isSymbolDetailsModalOpen, setIsSymbolDetailsModalOpen] = useState(false);
  const [selectedRemoveStrategyId, setSelectedRemoveStrategyId] = useState('');

  const { data: symbolsData, isLoading: isSymbolsLoading, error } = useTickerData(
    tickersPage,
    12,
    tickersFilter,
    tickersSearch
  );

  const getTickerStatusBadge = (ticker: Symbol) => {
    if (ticker.is_watched) {
      return { variant: "default" as const, label: "Watched" };
    } else if (ticker.is_active) {
      return { variant: "secondary" as const, label: "Active" };
    } else {
      return { variant: "outline" as const, label: "Inactive" };
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Search */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Tracked Tickers</h2>
          <p className="text-sm text-muted-foreground">
            Securities being monitored for news updates
          </p>
        </div>
        <div className="flex gap-2">
          <Input 
            placeholder="Search tickers..." 
            value={tickersSearch} 
            onChange={(e) => {
              setTickersSearch(e.target.value);
              setTickersPage(1); // Reset to first page when searching
            }}
            className="w-64"
          />
          <Select value={tickersFilter} onValueChange={(value) => {
            setTickersFilter(value);
            setTickersPage(1); // Reset to first page when filtering
          }}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="watched">Watched</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Not Active</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tickers Grid */}
      <div className="space-y-4">
        {isSymbolsLoading ? (
          // Loading skeleton grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-4 w-full" />
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : symbolsData?.symbols?.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {symbolsData.symbols.map((ticker: Symbol) => {
                const statusBadge = getTickerStatusBadge(ticker);
                return (
                  <Card 
                    key={ticker.id} 
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedSymbolForDetails(ticker);
                      setIsSymbolDetailsModalOpen(true);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-lg">{ticker.symbol}</h3>
                              <Badge variant={statusBadge.variant} className="text-xs">
                                {statusBadge.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {ticker.name || 'No company name available'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center pt-2">
                          <Badge variant="outline" className="text-xs">
                            {ticker.exchange || 'Unknown'}
                          </Badge>
                          <Button 
                            variant={ticker.is_watched ? 'destructive' : 'default'} 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent card click
                              if (ticker.is_watched) {
                                // Open confirmation dialog for removing ticker
                                setTickerToRemove(ticker);
                                setSelectedRemoveStrategyId('');
                                setIsRemoveModalOpen(true);
                              } else {
                                // Open modal for adding ticker
                                setSelectedTicker(ticker);
                                setIsWatchModalOpen(true);
                              }
                            }}
                          >
                             {ticker.is_watched ? 'Remove' : 'Add'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Pagination */}
            {symbolsData?.pagination && symbolsData.pagination.pages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTickersPage(prev => Math.max(1, prev - 1))}
                  disabled={!symbolsData.pagination.hasPrev}
                >
                  Previous
                </Button>
                
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, symbolsData.pagination.pages) }, (_, i) => {
                    const pageNum = i + 1;
                    const isCurrentPage = pageNum === tickersPage;
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={isCurrentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTickersPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  
                  {symbolsData.pagination.pages > 5 && tickersPage < symbolsData.pagination.pages - 2 && (
                    <>
                      <span className="px-2 py-1 text-sm text-muted-foreground">...</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTickersPage(symbolsData.pagination.pages)}
                        className="w-8 h-8 p-0"
                      >
                        {symbolsData.pagination.pages}
                      </Button>
                    </>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTickersPage(prev => Math.min(symbolsData.pagination.pages, prev + 1))}
                  disabled={!symbolsData.pagination.hasNext}
                >
                  Next
                </Button>
                
                <div className="ml-4 text-sm text-muted-foreground">
                  Page {tickersPage} of {symbolsData.pagination.pages} ({symbolsData.pagination.total} tickers)
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 text-muted-foreground">
              📊
            </div>
            <h3 className="text-xl font-semibold mb-2">No Tickers Found</h3>
            <p className="text-muted-foreground">
              {tickersSearch ? 
                `No tickers found matching "${tickersSearch}"` : 
                'No tickers are currently being tracked'
              }
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedTicker && (
        <AddToWatchModal
          isOpen={isWatchModalOpen}
          onClose={() => {
            setIsWatchModalOpen(false);
            setSelectedTicker(null);
          }}
          symbol={selectedTicker}
        />
      )}

      {tickerToRemove && (
        <RemoveFromWatchModal
          isOpen={isRemoveModalOpen}
          onClose={() => {
            setIsRemoveModalOpen(false);
            setTickerToRemove(null);
            setSelectedRemoveStrategyId('');
          }}
          symbol={tickerToRemove}
        />
      )}

      {selectedSymbolForDetails && (
        <SymbolDetailsModal
          isOpen={isSymbolDetailsModalOpen}
          onClose={() => {
            setIsSymbolDetailsModalOpen(false);
            setSelectedSymbolForDetails(null);
          }}
          symbol={selectedSymbolForDetails}
        />
      )}
    </div>
  );
};