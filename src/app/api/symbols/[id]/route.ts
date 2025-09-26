import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ApiResponse } from "@/types/api";
import { alpacaDataService } from "@/lib/alpaca/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    const { strategyId, allocatedCapital } = await req.json();
    const resolvedParams = await params;
    const symbolId = parseInt(resolvedParams.id);

    console.log(
      "Removing symbol from watch list:",
      strategyId,
      allocatedCapital
    );

    if (!strategyId || !allocatedCapital) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_PARAMETERS",
            message: "Strategy ID and allocated capital are required",
          },
        },
        { status: 400 }
      );
    }

    // Get the current symbol to check its current is_watched status
    const symbol = await prisma.symbols.findUnique({
      where: { id: symbolId },
      select: { id: true, symbol: true, is_watched: true },
    });

    if (!symbol) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SYMBOL_NOT_FOUND",
            message: "Symbol not found",
          },
        },
        { status: 404 }
      );
    }

    // Verify strategy exists
    const strategy = await prisma.strategies.findUnique({
      where: { id: strategyId },
      select: { id: true, name: true },
    });

    if (!strategy) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "STRATEGY_NOT_FOUND",
            message: "Strategy not found",
          },
        },
        { status: 404 }
      );
    }

    // Get the current market regime
    const globalMarketRegime = await prisma.global_market_regime.findFirst({
      orderBy: { created_at: "desc" },
      select: { current_regime_id: true },
    });

    if (!globalMarketRegime) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MARKET_REGIME_NOT_FOUND",
            message: "Current market regime not found",
          },
        },
        { status: 500 }
      );
    }

    const currentRegimeId = globalMarketRegime.current_regime_id;

    // If setting to watched, validate available capital
    if (!symbol.is_watched) {
      try {
        // Get current Alpaca portfolio value
        const alpacaAccount = await alpacaDataService.getAccount();
        const currentPortfolioValue = parseFloat(alpacaAccount.portfolioValue);

        // Get sum of all active allocated capital from strategy_allocations
        const activeAllocationsSum =
          await prisma.strategy_allocations.aggregate({
            _sum: {
              allocated_capital: true,
            },
            where: {
              is_active: true,
            },
          });

        const totalAllocatedCapital = activeAllocationsSum._sum
          .allocated_capital
          ? parseFloat(activeAllocationsSum._sum.allocated_capital.toString())
          : 0;

        // Calculate available capital
        const availableCapital = currentPortfolioValue - totalAllocatedCapital;

        // Check if requested allocation exceeds available capital
        if (allocatedCapital > availableCapital) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: "INSUFFICIENT_CAPITAL",
                message: "Requested allocation exceeds available capital",
                details: `Requested: $${allocatedCapital}, Available: $${availableCapital}, Portfolio Value: $${currentPortfolioValue}, Total Allocated: $${totalAllocatedCapital}`,
              },
            },
            { status: 400 }
          );
        }
      } catch (alpacaError) {
        console.error("Error fetching Alpaca account data:", alpacaError);
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "ALPACA_ERROR",
              message: "Failed to validate portfolio balance",
              details:
                alpacaError instanceof Error
                  ? alpacaError.message
                  : "Unknown Alpaca error",
            },
          },
          { status: 500 }
        );
      }
    }

    // Toggle the is_watched status
    const newWatchedStatus = !symbol.is_watched;

    // Start a transaction to ensure all operations succeed together
    const result = await prisma.$transaction(async (tx) => {
      // Update the symbol's is_watched status
      const updatedSymbol = await tx.symbols.update({
        where: { id: symbolId },
        data: { is_watched: newWatchedStatus },
      });

      // If setting to watched (true), create or reactivate the strategy relationships
      if (newWatchedStatus) {
        // Upsert strategy_ticker_regimes entry (create if not exists, update if exists)
        const strategyTickerRegime = await tx.strategy_ticker_regimes.upsert({
          where: {
            strategy_id_symbol_id_regime_id: {
              strategy_id: strategyId,
              symbol_id: symbolId,
              regime_id: currentRegimeId,
            },
          },
          update: {
            is_active: true,
            regime_parameters: {
              notes: "Reduce exposure in this regime",
              stop_loss_pct: 0.03,
              take_profit_pct: 0.06,
              position_size_multiplier: 0.5,
            },
          },
          create: {
            strategy_id: strategyId,
            symbol_id: symbolId,
            symbol: symbol.symbol,
            regime_id: currentRegimeId,
            regime_parameters: {
              notes: "Reduce exposure in this regime",
              stop_loss_pct: 0.03,
              take_profit_pct: 0.06,
              position_size_multiplier: 0.5,
            },
            is_active: true,
          },
        });

        // Check if strategy allocation already exists
        const existingAllocation = await tx.strategy_allocations.findFirst({
          where: {
            strategy_id: strategyId,
            symbol_id: symbolId,
          },
        });

        let strategyAllocation;
        if (existingAllocation) {
          // Update existing allocation
          strategyAllocation = await tx.strategy_allocations.update({
            where: { id: existingAllocation.id },
            data: {
              allocated_capital: allocatedCapital,
              is_active: true,
            },
          });
        } else {
          // Create new allocation
          strategyAllocation = await tx.strategy_allocations.create({
            data: {
              strategy_id: strategyId,
              symbol_id: symbolId,
              allocated_capital: allocatedCapital,
              used_capital: 0,
              reserved_capital: 0,
              current_position: 0,
              average_cost: 0,
              realized_pnl: 0,
              unrealized_pnl: 0,
              total_trades: 0,
              winning_trades: 0,
              allocation_percentage: null,
              is_active: true,
              last_trade_time: null,
            },
          });
        }

        return {
          symbol: updatedSymbol,
          strategyTickerRegime,
          strategyAllocation,
        };
      } else {
        // If setting to not watched (false), update symbol and deactivate strategy relationships
        const updatedSymbolToFalse = await tx.symbols.update({
          where: { id: symbolId },
          data: { is_watched: false },
        });

        // Mark strategy relationships as inactive (preserve historical data)
        await tx.strategy_ticker_regimes.updateMany({
          where: {
            strategy_id: strategyId,
            symbol_id: symbolId,
          },
          data: { is_active: false },
        });

        await tx.strategy_allocations.updateMany({
          where: {
            strategy_id: strategyId,
            symbol_id: symbolId,
          },
          data: { is_active: false },
        });

        return {
          symbol: updatedSymbolToFalse,
          strategyTickerRegime: null,
          strategyAllocation: null,
        };
      }
    });

    // Get updated portfolio info for response
    let portfolioInfo = null;
    try {
      const alpacaAccount = await alpacaDataService.getAccount();
      const activeAllocationsSum = await prisma.strategy_allocations.aggregate({
        _sum: {
          allocated_capital: true,
        },
        where: {
          is_active: true,
        },
      });

      const currentPortfolioValue = parseFloat(alpacaAccount.portfolioValue);
      const totalAllocatedCapital = activeAllocationsSum._sum.allocated_capital
        ? parseFloat(activeAllocationsSum._sum.allocated_capital.toString())
        : 0;

      portfolioInfo = {
        currentPortfolioValue,
        totalAllocatedCapital,
        availableCapital: currentPortfolioValue - totalAllocatedCapital,
      };
    } catch (error) {
      console.warn(
        "Could not fetch updated portfolio info for response:",
        error
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        symbol: {
          id: result.symbol.id,
          symbol: result.symbol.symbol,
          name: result.symbol.name,
          is_watched: result.symbol.is_watched,
        },
        strategy: {
          id: strategy.id,
          name: strategy.name,
        },
        currentRegimeId,
        strategyTickerRegime: result.strategyTickerRegime,
        strategyAllocation: result.strategyAllocation,
        action: newWatchedStatus ? "added_to_watch" : "removed_from_watch",
        portfolioInfo,
      },
    });
  } catch (error) {
    console.error("Symbol watch toggle error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SYMBOL_WATCH_TOGGLE_ERROR",
          message: "Failed to toggle symbol watch status",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 }
    );
  }
}
