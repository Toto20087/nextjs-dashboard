import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Globe, Clock, Brain } from "lucide-react";
import { getSentimentColor, getSentimentLabel, formatTimestamp } from "@/lib/utils/newsUtils";

interface NewsArticle {
  id: number;
  title: string;
  content: string;
  source: string;
  publishedAt: string;
  category: string;
  sentiment: {
    score: number;
    confidence: number;
  };
  impactScore: number;
  symbol?: {
    symbol: string;
  };
}

interface NewsDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: NewsArticle | null;
}

const getImpactLevel = (score: number | null) => {
  if (score === null) return 'unknown';
  if (score > 0.7) return 'high';
  if (score > 0.4) return 'medium';
  return 'low';
};

const getImpactBadgeVariant = (impact: string) => {
  switch (impact) {
    case 'high':
      return 'destructive' as const;
    case 'medium':
      return 'default' as const;
    case 'low':
      return 'secondary' as const;
    default:
      return 'outline' as const;
  }
};

export const NewsDetailsModal: React.FC<NewsDetailsModalProps> = ({
  isOpen,
  onClose,
  article
}) => {
  if (!article) return null;

  const sentimentScore = Number(article.sentiment?.score) || 0;
  const confidenceScore = Number(article.sentiment?.confidence) || 0;
  const impactScore = Number(article.impactScore) || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold pr-8">
            {article.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* News Header Info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span className="font-medium">{article.source || 'Unknown Source'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{formatTimestamp(article.publishedAt)}</span>
            </div>
            <Badge variant={getImpactBadgeVariant(getImpactLevel(impactScore))}>
              {getImpactLevel(impactScore)} impact
            </Badge>
            {article.category && (
              <Badge variant="outline" className="capitalize">
                {article.category.replace('-', ' ')}
              </Badge>
            )}
          </div>

          {/* Sentiment & Confidence */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Market Sentiment</div>
                    <div className={`text-lg font-bold ${getSentimentColor(sentimentScore)}`}>
                      {getSentimentLabel(sentimentScore)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Score: {sentimentScore.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {sentimentScore > 0 ? '+' : ''}{(sentimentScore * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">AI Confidence</div>
                    <div className="text-lg font-bold">
                      {(confidenceScore * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {confidenceScore > 0.9 ? 'Very High' : 
                       confidenceScore > 0.8 ? 'High' : 
                       confidenceScore > 0.7 ? 'Medium' : 'Low'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Brain className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* News Content */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Content</h3>
            <p className="text-muted-foreground leading-relaxed">
              {article.content || 'No content available'}
            </p>
          </div>

          {/* Affected Tickers */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Affected Securities</h3>
            <div className="flex flex-wrap gap-2">
              {article.symbol ? (
                <Badge variant="secondary" className="px-3 py-1 text-sm font-mono">
                  {article.symbol.symbol}
                </Badge>
              ) : (
                <p className="text-muted-foreground text-sm">No specific securities identified</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};