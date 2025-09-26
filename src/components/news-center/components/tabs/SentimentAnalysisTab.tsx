import { useState } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useSentimentData } from "../../hooks/useSentimentData";
import { getSentimentColor } from "@/lib/utils/newsUtils";

export const SentimentAnalysisTab: React.FC = () => {
  const [sentimentTimeRange, setSentimentTimeRange] = useState("1d");
  const { data: sentimentData, isLoading: isSentimentLoading } = useSentimentData(sentimentTimeRange);

  return (
    <div className="space-y-4">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Sentiment Analysis</h2>
          <p className="text-sm text-muted-foreground">
            Analyze market sentiment trends across different time periods
          </p>
        </div>
        <Select value={sentimentTimeRange} onValueChange={setSentimentTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Time Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1d">1 Day</SelectItem>
            <SelectItem value="1w">1 Week</SelectItem>
            <SelectItem value="1m">1 Month</SelectItem>
            <SelectItem value="3m">3 Months</SelectItem>
            <SelectItem value="6m">6 Months</SelectItem>
            <SelectItem value="1y">1 Year</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-6">
        {/* Top row with two charts side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sentiment Trend */}
          <Card>
          <CardHeader>
            <CardTitle>Sentiment Trend</CardTitle>
            <CardDescription>
              Market sentiment over {sentimentTimeRange === '1d' ? 'the last 24 hours' : 
              sentimentTimeRange === '1w' ? 'the last week' : 
              sentimentTimeRange === '1m' ? 'the last month' : 
              sentimentTimeRange === '3m' ? 'the last 3 months' : 
              sentimentTimeRange === '6m' ? 'the last 6 months' : 
              sentimentTimeRange === '1y' ? 'the last year' : 'all time'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSentimentLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="space-y-2 text-center">
                  <Skeleton className="h-4 w-32 mx-auto" />
                  <Skeleton className="h-4 w-24 mx-auto" />
                </div>
              </div>
            ) : sentimentData?.sentimentTrend ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={sentimentData.sentimentTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={[-1, 1]} />
                  <Tooltip 
                    formatter={(value: number | string, name: string) => {
                      if (name === 'sentiment') {
                        return [Number(value).toFixed(3), 'Sentiment'];
                      }
                      return [value, name];
                    }}
                    labelFormatter={(label) => `Time: ${label}`}
                  />
                  <Line type="monotone" dataKey="sentiment" stroke="hsl(var(--chart-1))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No sentiment data available for this time range
              </div>
            )}
          </CardContent>
        </Card>

        {/* News Volume */}
        <Card>
          <CardHeader>
            <CardTitle>News Volume</CardTitle>
            <CardDescription>
              Article volume over {sentimentTimeRange === '1d' ? 'the last 24 hours' : 
              sentimentTimeRange === '1w' ? 'the last week' : 
              sentimentTimeRange === '1m' ? 'the last month' : 
              sentimentTimeRange === '3m' ? 'the last 3 months' : 
              sentimentTimeRange === '6m' ? 'the last 6 months' : 
              sentimentTimeRange === '1y' ? 'the last year' : 'all time'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSentimentLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="space-y-2 text-center">
                  <Skeleton className="h-4 w-32 mx-auto" />
                  <Skeleton className="h-4 w-24 mx-auto" />
                </div>
              </div>
            ) : sentimentData?.sentimentTrend ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sentimentData.sentimentTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any, name: string) => {
                      if (name === 'volume') {
                        return [Number(value), 'Articles'];
                      }
                      return [value, name];
                    }}
                    labelFormatter={(label) => `Time: ${label}`}
                  />
                  <Bar dataKey="volume" fill="hsl(var(--chart-2))" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No volume data available for this time range
              </div>
            )}
          </CardContent>
        </Card>
        </div>

        {/* Sentiment Breakdown - Full width below */}
        <Card>
          <CardHeader>
            <CardTitle>Sentiment Breakdown</CardTitle>
            <CardDescription>
              Sentiment distribution for {sentimentTimeRange === '1d' ? 'the last 24 hours' : 
              sentimentTimeRange === '1w' ? 'the last week' : 
              sentimentTimeRange === '1m' ? 'the last month' : 
              sentimentTimeRange === '3m' ? 'the last 3 months' : 
              sentimentTimeRange === '6m' ? 'the last 6 months' : 
              sentimentTimeRange === '1y' ? 'the last year' : 'all time'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isSentimentLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-8" />
                    </div>
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
              </div>
            ) : sentimentData?.sentimentBreakdown ? (
              sentimentData.sentimentBreakdown.map((item: { label: string; percentage: number; count: number }, index: number) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">{item.label}</span>
                    <span className="text-sm font-medium">
                      {item.percentage}% ({item.count} articles)
                    </span>
                  </div>
                  <Progress value={item.percentage} className="h-2" />
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No sentiment breakdown data available for this time range
              </div>
            )}
            
            {/* Summary Stats */}
            {sentimentData?.summary && (
              <div className="mt-6 pt-4 border-t border-border w-full">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total Articles:</span>
                    <div className="font-medium">{sentimentData.summary.totalArticles}</div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-muted-foreground">Avg Sentiment:</span>
                    <div className={`font-medium ${getSentimentColor(sentimentData.summary.averageSentiment)}`}>
                      {sentimentData.summary.averageSentiment.toFixed(3)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};