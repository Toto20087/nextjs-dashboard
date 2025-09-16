import { NextRequest, NextResponse } from 'next/server';
import { alpacaDataService } from '@/lib/alpaca/client';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol: rawSymbol } = await params;
    const symbol = rawSymbol.toUpperCase();
    const { searchParams } = new URL(req.url);
    const timeframe = searchParams.get('timeframe') || '1Day';
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Calculate date range if not provided
    const endDate = end ? new Date(end) : new Date();
    const startDate = start ? new Date(start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Map timeframe to Alpaca API format
    const alpacaTimeframe = timeframe === '1Day' ? '1Day' as const : 
                           timeframe === '1Hour' ? '1Hour' as const :
                           timeframe === '1Min' ? '1Min' as const :
                           timeframe === '5Min' ? '5Min' as const :
                           timeframe === '15Min' ? '15Min' as const :
                           '1Day' as const;

    // Fetch historical bars from Alpaca
    const bars = await alpacaDataService.getHistoricalBars(symbol, {
      timeframe: alpacaTimeframe,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      limit
    });

    // Transform the data to expected format
    const transformedBars = bars.map((bar) => ({
      timestamp: bar.timestamp,
      time: bar.timestamp,
      open: bar.open,
      high: bar.high,
      low: bar.low,
      close: bar.close,
      volume: bar.volume,
      date: new Date(bar.timestamp).toISOString().split('T')[0]
    }));

    return NextResponse.json({
      success: true,
      data: {
        symbol,
        timeframe,
        bars: transformedBars,
        metadata: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          count: transformedBars.length,
        },
      },
    });
  } catch (error) {
    console.error('Historical data API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'HISTORICAL_DATA_ERROR',
          message: `Failed to fetch historical data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      },
      { status: 500 }
    );
  }
}