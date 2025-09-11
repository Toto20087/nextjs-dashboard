# RFC-001: Next.js Backend Architecture for Trading Platform

**RFC Number:** 001  
**Title:** Next.js Backend Architecture for Trading Platform  
**Status:** Draft  
**Created:** 2025-01-19  
**Authors:** Trading Platform Team  
**Reviewers:** TBD  
**Related RFCs:** RFC-000  

## 1. Abstract

This RFC defines the optimal architecture for implementing a Next.js backend that serves as the central API gateway for a trading platform. The backend will integrate with Alpaca for market data and account information retrieval, communicate with a PostgreSQL database for data persistence, and coordinate with an external backtesting service for strategy validation.

## 2. Background/Motivation

### Problem Statement
The trading platform requires a robust, scalable backend that can handle real-time trading operations, manage user authentication, process market data, and coordinate between multiple external services while maintaining high performance and reliability.

### Current State
- Next.js application with basic frontend components
- PostgreSQL database with comprehensive trading schema
- External backtesting service running on localhost:8000
- Alpaca integration requirements for market data and account information

### Goals
- Implement optimized Next.js API routes with proper separation of concerns
- Establish secure communication with Alpaca API for market data retrieval
- Create efficient database operations with proper connection pooling
- Integrate seamlessly with backtesting service
- Implement comprehensive error handling and logging
- Ensure high performance with proper caching strategies

### Non-Goals
- Real-time WebSocket implementation (future RFC)
- Advanced analytics engine (separate service)
- Mobile app API endpoints (future consideration)

## 3. Detailed Design

### 3.1 Architecture Overview

```mermaid
graph TB
    Client[Next.js Frontend] --> API[Next.js API Routes]
    API --> Auth[Authentication Layer]
    API --> DB[(PostgreSQL Database)]
    API --> Alpaca[Alpaca Market Data API]
    API --> Backtest[Backtesting Service]
    
    subgraph "Next.js Backend"
        API
        Auth
        Middleware[Validation & Security]
    end
```

### 3.2 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   ├── strategies/
│   │   ├── signals/
│   │   ├── portfolio/
│   │   ├── backtests/
│   │   ├── market-data/
│   │   └── users/
├── lib/
│   ├── db/
│   │   ├── prisma.ts
│   │   └── services/
│   ├── alpaca/
│   ├── auth/
│   │   └── clerk.ts
│   └── utils/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── types/
├── middleware.ts
└── services/
```

### 3.3 Clerk Middleware Configuration

```typescript
// middleware.ts
import { authMiddleware } from '@clerk/nextjs';

export default authMiddleware({
  // Routes that can be accessed while signed out
  publicRoutes: [
    '/',
    '/api/health',
    '/api/market-data/(.*)', // Public market data endpoints
  ],
  
  // Routes that require authentication
  protectedRoutes: [
    '/api/strategies/(.*)',
    '/api/signals/(.*)',
    '/api/portfolio/(.*)',
    '/api/backtests/(.*)',
    '/control-center/(.*)',
    '/live-trading/(.*)',
    '/strategy-lab/(.*)',
  ],
  
  // API routes that should be protected
  apiRoutes: ['/api/(.*)'],
});

export const config = {
  matcher: [
    '/((?!.+\\.[\\w]+$|_next).*)',
    '/',
    '/(api|trpc)(.*)'
  ]
};
```

### 3.4 API Endpoints Specification

#### 3.4.1 Authentication with Clerk

```typescript
// lib/auth/clerk.ts
import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';

export async function requireAuth() {
  const { userId } = auth();
  
  if (!userId) {
    redirect('/sign-in');
  }
  
  return userId;
}

export async function getUser() {
  const { userId, user } = auth();
  return { userId, user };
}

// Middleware for API routes
export async function withAuth(handler: Function) {
  return async (req: Request) => {
    const { userId } = auth();
    
    if (!userId) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return handler(req, { userId });
  };
}
```

#### 3.4.2 Strategy Management Endpoints

```typescript
// app/api/strategies/route.ts
import { withAuth } from '@/lib/auth/clerk';
import { StrategyService } from '@/lib/db/services/strategyService';

export const GET = withAuth(async (req: Request, { userId }: { userId: string }) => {
  try {
    const strategies = await StrategyService.findAll({
      take: 50,
      where: { userId }, // Filter by authenticated user
    });

    return Response.json({
      success: true,
      data: { strategies }
    });
  } catch (error) {
    return Response.json(
      { success: false, error: 'Failed to fetch strategies' },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (req: Request, { userId }: { userId: string }) => {
  try {
    const body = await req.json();
    const strategy = await StrategyService.create({
      ...body,
      userId, // Associate with authenticated user
    });

    return Response.json({
      success: true,
      data: { strategy }
    });
  } catch (error) {
    return Response.json(
      { success: false, error: 'Failed to create strategy' },
      { status: 500 }
    );
  }
});

// Additional endpoints:
// PUT /api/strategies/[id]
// DELETE /api/strategies/[id]
// GET /api/strategies/[id]/parameters
// PUT /api/strategies/[id]/parameters
```

#### 3.4.3 Signal Processing Endpoints

```typescript
// POST /api/signals
interface CreateSignalRequest {
  strategy_id: number;
  symbol_id: number;
  ticker_symbol: string;
  signal_type: 'BUY' | 'SELL';
  quantity: number;
  order_type?: 'MARKET' | 'LIMIT' | 'STOP';
  limit_price?: number;
  stop_price?: number;
  time_in_force?: 'DAY' | 'GTC';
}

// GET /api/signals
// GET /api/signals/[id]
// PUT /api/signals/[id]/status
```

#### 3.4.4 Portfolio Management Endpoints

```typescript
// GET /api/portfolio/positions
interface PositionsResponse {
  success: boolean;
  data: {
    positions: Position[];
    total_value: number;
    unrealized_pnl: number;
  };
}

// GET /api/portfolio/account
interface AccountResponse {
  success: boolean;
  data: {
    account_value: number;
    buying_power: number;
    cash: number;
    portfolio_value: number;
    day_trade_count: number;
  };
}

// GET /api/portfolio/history
// GET /api/portfolio/performance
```

#### 3.4.5 Backtesting Integration Endpoints

```typescript
// POST /api/backtests
interface BacktestRequest {
  strategy_id: number;
  symbols: string[];
  parameters: Record<string, any>;
  period_start: string;
  period_end: string;
  initial_capital?: number;
}

interface BacktestResponse {
  success: boolean;
  data: {
    backtest_id: number;
    status: 'pending' | 'running' | 'completed' | 'failed';
  };
}

// GET /api/backtests
// GET /api/backtests/[id]
// GET /api/backtests/[id]/results
// DELETE /api/backtests/[id]
```

#### 3.4.6 Market Data Endpoints

```typescript
// GET /api/market-data/[symbol]
interface MarketDataResponse {
  success: boolean;
  data: {
    symbol: string;
    price: number;
    change: number;
    change_percent: number;
    volume: number;
    timestamp: string;
  };
}

// GET /api/market-data/[symbol]/history
// GET /api/market-data/symbols/search
```

### 3.5 Database Integration with Prisma ORM

#### 3.5.1 Prisma Client Configuration

```typescript
// lib/db/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query', 'error', 'warn'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

#### 3.5.2 Prisma Schema Definition

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Strategy {
  id               Int      @id @default(autoincrement())
  name             String   @unique
  processedByRust  Boolean  @default(true) @map("processed_by_rust")
  isActive         Boolean  @default(true) @map("is_active")
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  // Relations
  allocations      StrategyAllocation[]
  parameters       StrategyParameter[]
  signals          Signal[]
  backtests        Backtest[]

  @@map("strategies")
}

model StrategyAllocation {
  id               Int     @id @default(autoincrement())
  strategyId       Int     @map("strategy_id")
  symbolId         Int     @map("symbol_id")
  allocatedCapital Decimal @map("allocated_capital") @db.Decimal(15, 2)
  usedCapital      Decimal @default(0) @map("used_capital") @db.Decimal(15, 2)
  reservedCapital  Decimal @default(0) @map("reserved_capital") @db.Decimal(15, 2)
  currentPosition  Decimal @default(0) @map("current_position") @db.Decimal(15, 8)
  averageCost      Decimal @default(0) @map("average_cost") @db.Decimal(15, 2)

  // Relations
  strategy         Strategy @relation(fields: [strategyId], references: [id])
  symbol           Symbol   @relation(fields: [symbolId], references: [id])

  @@map("strategy_allocations")
}

model Signal {
  id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  strategyId      Int      @map("strategy_id")
  symbolId        Int      @map("symbol_id")
  tickerSymbol    String   @map("ticker_symbol") @db.VarChar(10)
  source          String   @default("strategy") @db.VarChar(50)
  signalType      String   @map("signal_type") @db.VarChar(10)
  quantity        Decimal  @db.Decimal(15, 6)
  urgency         String   @default("normal") @db.VarChar(20)
  confidenceScore Decimal? @map("confidence_score") @db.Decimal(3, 2)
  orderType       String   @default("MARKET") @map("order_type") @db.VarChar(20)
  limitPrice      Decimal? @map("limit_price") @db.Decimal(15, 2)
  stopPrice       Decimal? @map("stop_price") @db.Decimal(15, 2)
  timeInForce     String   @default("DAY") @map("time_in_force") @db.VarChar(10)
  stopLoss        Decimal? @map("stop_loss") @db.Decimal(15, 2)
  takeProfit      Decimal? @map("take_profit") @db.Decimal(15, 2)
  createdAt       DateTime @default(now()) @map("created_at")

  // Relations
  strategy        Strategy @relation(fields: [strategyId], references: [id])
  symbol          Symbol   @relation(fields: [symbolId], references: [id])

  @@map("signals")
}
```

#### 3.5.3 Prisma Service Layer

```typescript
// lib/db/services/strategyService.ts
import { prisma } from '../prisma'
import { Strategy, Prisma } from '@prisma/client'

export class StrategyService {
  static async findAll(params: {
    skip?: number
    take?: number
    where?: Prisma.StrategyWhereInput
    include?: Prisma.StrategyInclude
  }) {
    const { skip, take, where, include } = params

    return await prisma.strategy.findMany({
      skip,
      take,
      where: {
        isActive: true,
        ...where,
      },
      include: {
        allocations: true,
        parameters: true,
        _count: {
          select: {
            signals: true,
            backtests: true,
          },
        },
        ...include,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })
  }

  static async findById(id: number) {
    return await prisma.strategy.findUnique({
      where: { id },
      include: {
        allocations: {
          include: {
            symbol: true,
          },
        },
        parameters: true,
      },
    })
  }

  static async create(data: Prisma.StrategyCreateInput) {
    return await prisma.strategy.create({
      data,
      include: {
        allocations: true,
        parameters: true,
      },
    })
  }

  static async update(id: number, data: Prisma.StrategyUpdateInput) {
    return await prisma.strategy.update({
      where: { id },
      data,
      include: {
        allocations: true,
        parameters: true,
      },
    })
  }

  static async delete(id: number) {
    return await prisma.strategy.update({
      where: { id },
      data: {
        isActive: false,
      },
    })
  }
}
```

#### 3.5.4 Database Transaction Support

```typescript
// lib/db/services/signalService.ts
import { prisma } from '../prisma'
import { Prisma } from '@prisma/client'

export class SignalService {
  static async createWithAllocation(
    signalData: Prisma.SignalCreateInput,
    allocationUpdate: {
      strategyId: number
      symbolId: number
      usedCapitalDelta: number
    }
  ) {
    return await prisma.$transaction(async (tx) => {
      // Create the signal
      const signal = await tx.signal.create({
        data: signalData,
        include: {
          strategy: true,
          symbol: true,
        },
      })

      // Update the strategy allocation
      await tx.strategyAllocation.updateMany({
        where: {
          strategyId: allocationUpdate.strategyId,
          symbolId: allocationUpdate.symbolId,
        },
        data: {
          usedCapital: {
            increment: allocationUpdate.usedCapitalDelta,
          },
        },
      })

      return signal
    })
  }
}
```

### 3.6 Alpaca Market Data Service

```typescript
// lib/alpaca/client.ts
import Alpaca from '@alpacahq/alpaca-trade-api';

class AlpacaDataService {
  private client: Alpaca;

  constructor() {
    this.client = new Alpaca({
      credentials: {
        key: process.env.ALPACA_API_KEY!,
        secret: process.env.ALPACA_API_SECRET!,
        paper: process.env.NODE_ENV !== 'production',
      },
      rate_limit: true,
    });
  }

  async getMarketData(symbol: string): Promise<AlpacaQuote> {
    try {
      const quote = await this.client.getLatestQuote(symbol);
      return quote;
    } catch (error) {
      throw new AlpacaError(`Market data fetch failed: ${error.message}`);
    }
  }

  async getHistoricalData(
    symbol: string, 
    timeframe: string, 
    start: string, 
    end: string
  ): Promise<AlpacaBar[]> {
    try {
      const bars = await this.client.getBarsV2(symbol, {
        timeframe,
        start,
        end,
        limit: 1000,
      });
      return bars;
    } catch (error) {
      throw new AlpacaError(`Historical data fetch failed: ${error.message}`);
    }
  }

  async getAccount(): Promise<AlpacaAccount> {
    try {
      return await this.client.getAccount();
    } catch (error) {
      throw new AlpacaError(`Account data fetch failed: ${error.message}`);
    }
  }

  async getPositions(): Promise<AlpacaPosition[]> {
    try {
      return await this.client.getPositions();
    } catch (error) {
      throw new AlpacaError(`Positions data fetch failed: ${error.message}`);
    }
  }

  async getPortfolioHistory(): Promise<AlpacaPortfolioHistory> {
    try {
      return await this.client.getPortfolioHistory();
    } catch (error) {
      throw new AlpacaError(`Portfolio history fetch failed: ${error.message}`);
    }
  }
}

export const alpacaDataService = new AlpacaDataService();
```

### 3.7 Backtesting Service Integration

```typescript
// lib/backtest/client.ts
interface BacktestServiceRequest {
  strategy_name: string;
  symbols: string[];
  parameters: Record<string, any>;
  start_date: string;
  end_date: string;
  initial_capital: number;
}

class BacktestService {
  private baseUrl = 'http://localhost:8000';

  async runBacktest(request: BacktestServiceRequest): Promise<BacktestResult> {
    const response = await fetch(`${this.baseUrl}/api/backtest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new BacktestError(`Backtest failed: ${response.statusText}`);
    }

    return await response.json();
  }

  async getBacktestStatus(backtestId: string): Promise<BacktestStatus> {
    const response = await fetch(`${this.baseUrl}/api/backtest/${backtestId}`);
    return await response.json();
  }
}

export const backtestService = new BacktestService();
```

## 4. Implementation Plan

### Phase 1: Core Infrastructure (Week 1-2)
- Set up Next.js API routes structure
- Configure Prisma ORM with existing database schema
- Generate Prisma client and database migrations
- Create authentication middleware
- Basic error handling and logging

### Phase 2: Market Data Integration (Week 3-4)
- Strategy management endpoints
- Signal processing system
- Alpaca integration for market data and account information
- Chart data endpoints and caching

### Phase 3: Backtesting Integration (Week 5)
- Backtesting service communication
- Results storage and retrieval
- Performance metrics calculation

### Phase 4: Optimization (Week 6)
- Implement Next.js caching strategies
- Rate limiting and security hardening
- Performance monitoring and logging

## 5. Security Considerations

### Authentication & Authorization
- Clerk-based authentication with session management
- User identification through Clerk userId
- Role-based access control through Clerk metadata
- API key management for service-to-service communication

### Data Protection
- Encrypt sensitive data at rest
- Use environment variables for all secrets
- Implement proper input validation and sanitization

### API Security
- Rate limiting per endpoint
- CORS configuration
- Request size limits
- SQL injection prevention through parameterized queries

## 6. Performance Impact

### Expected Performance Characteristics

| Operation | Target Latency | Max Latency | Throughput |
|-----------|---------------|-------------|------------|
| Signal Processing | < 50ms | 200ms | 100 signals/sec |
| Market Data Fetch | < 20ms | 100ms | 1000 requests/sec |
| Historical Data Fetch | < 200ms | 1000ms | 100 requests/sec |
| Account Data Fetch | < 100ms | 500ms | 200 requests/sec |
| Database Queries | < 10ms | 50ms | 500 queries/sec |

### Optimization Strategies
- Prisma connection pooling and query optimization
- Efficient database indexing with Prisma schema
- Next.js built-in caching for API routes
- Lazy loading for heavy operations
- Prisma query batching and relation optimization

## 7. Testing Strategy

### Unit Testing
- Jest for utility functions and services
- Mock external API calls
- Prisma service layer testing with test database
- Database transaction testing

### Integration Testing
- API endpoint testing with Supertest
- Prisma transaction and relationship testing
- External service integration testing

### Load Testing
- Artillery.js for API load testing
- Database performance testing
- Alpaca market data API rate limit testing

## 8. Rollout Plan

### Development Environment
- Local PostgreSQL with seed data
- Alpaca market data API (paper environment)
- Mock backtesting service for development

### Staging Environment
- Production-like database setup
- Alpaca market data API (paper environment)
- Full backtesting service integration

### Production Deployment
- Blue-green deployment strategy
- Database migration scripts
- Monitoring and alerting setup

## 9. Success Metrics

### Performance Metrics
- API response times < target latencies
- 99.9% uptime
- Zero data loss during operations

### Business Metrics
- Market data availability > 99.5%
- Chart data loading time < 2 seconds
- Backtest completion time < 5 minutes
- System handles 10,000+ daily operations

## 10. Alternatives Considered

### Express.js Backend
- **Pros**: More flexible, lighter weight
- **Cons**: Additional deployment complexity, no built-in optimization
- **Decision**: Next.js chosen for unified deployment and built-in optimizations

### Separate Microservices
- **Pros**: Better separation of concerns, independent scaling
- **Cons**: Increased complexity, network overhead
- **Decision**: Monolithic Next.js API chosen for initial implementation

### GraphQL API
- **Pros**: Flexible queries, type safety
- **Cons**: Additional complexity, caching challenges
- **Decision**: REST API chosen for simplicity and better caching

## 11. Open Questions

1. Should we implement WebSocket connections for real-time updates in this phase?
2. Should we implement server-side caching for frequently requested market data?
3. How should we handle Alpaca market data API rate limits during high-volume periods?
4. Should backtesting be synchronous or asynchronous?

## 12. References

- [Next.js API Routes Documentation](https://nextjs.org/docs/api-routes/introduction)
- [Alpaca Market Data API](https://alpaca.markets/docs/api-documentation/market-data/)
- [PostgreSQL Connection Pooling Best Practices](https://www.postgresql.org/docs/current/runtime-config-connection.html)
- [RFC-000: RFC Template and Standards](./RFC-000-rfc-template-and-standards.md)

## Appendix A: Database Tables Used

### Core Trading Tables
- `strategies`: Strategy definitions and configurations
- `strategy_parameters`: Strategy-specific parameters
- `strategy_allocations`: Capital allocation per strategy-symbol pair
- `signals`: Trading signals generated by strategies
- `positions`: Current portfolio positions for display purposes
- `market_data`: Historical and current market data storage

### Backtesting Tables
- `backtests`: Backtest run metadata
- `backtest_runs`: Individual backtest execution details
- `backtest_metrics`: Performance metrics from backtests
- `backtest_trades`: Individual trades from backtest runs

### User & Security Tables
- `users`: User account management
- `accounts`: OAuth provider accounts
- `api_keys`: API key management
- `sessions`: User session management
- `audit_log`: System audit trail

### System Tables
- `alerts`: System alerts and notifications
- `risk_limits`: Risk management limits
- `system_config`: Application configuration
- `market_status`: Market session tracking

## Appendix B: Environment Variables

```bash
# Database (Prisma)
DATABASE_URL=postgresql://username:password@localhost:5432/southdev_trader

# Database Connection Details (Optional)
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=southdev_trader
DATABASE_USER=username
DATABASE_PASSWORD=password

# Alpaca
ALPACA_API_KEY=your_alpaca_key
ALPACA_API_SECRET=your_alpaca_secret
ALPACA_PAPER=true

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_secret_here
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/control-center
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/control-center

# Backtesting Service
BACKTEST_SERVICE_URL=http://localhost:8000
```

## Appendix C: Prisma Commands

```bash
# Initialize Prisma (if starting fresh)
npx prisma init

# Generate Prisma client after schema changes
npx prisma generate

# Create and apply database migrations
npx prisma migrate dev --name init

# Reset database and apply all migrations
npx prisma migrate reset

# Push schema changes to database without migration
npx prisma db push

# Open Prisma Studio for database inspection
npx prisma studio

# Seed the database
npx prisma db seed

# Pull existing database schema into Prisma schema
npx prisma db pull
```

## Appendix D: Dashboard Endpoints Specification

This section details the specific endpoints required for each dashboard page, including data sources and processing requirements.

### D.1 Portfolio Performance Dashboard

#### D.1.1 Portfolio vs SPY Comparison Chart
```typescript
// GET /api/dashboard/portfolio/performance
interface PortfolioPerformanceResponse {
  success: boolean;
  data: {
    currentValue: number;
    totalReturn: number;
    totalReturnPercent: number;
    spyReturn: number;
    spyReturnPercent: number;
    chartData: {
      date: string;
      portfolioValue: number;
      spyValue: number;
    }[];
    metadata: {
      startDate: string;
      endDate: string;
      dataSource: 'alpaca';
    };
  };
}
```

**Data Sources:**
- Alpaca Portfolio History API for historical portfolio performance
- Alpaca Market Data API for SPY historical data (aligned with portfolio start date)

**Processing Logic:**
- Fetch portfolio historical data from Alpaca
- Retrieve SPY data from the earliest portfolio date
- Calculate percentage returns: `(current - initial) / initial * 100`
- Normalize data points for chart visualization

#### D.1.2 Active Positions
```typescript
// GET /api/dashboard/portfolio/positions
interface ActivePositionsResponse {
  success: boolean;
  data: {
    positions: {
      symbol: string;
      quantity: number;
      marketValue: number;
      unrealizedPnl: number;
      unrealizedPnlPercent: number;
      averageCost: number;
      currentPrice: number;
    }[];
    totalValue: number;
    totalUnrealizedPnl: number;
  };
}
```

**Data Source:** Direct from Alpaca Positions API

### D.2 Strategy Management Dashboard

#### D.2.1 Active Strategies Overview
```typescript
// GET /api/dashboard/strategies/active
interface ActiveStrategiesResponse {
  success: boolean;
  data: {
    strategies: {
      id: number;
      name: string;
      status: 'active' | 'paused';
      allocatedCapital: number;
      usedCapital: number;
      availableCapital: number;
      currentPositions: number;
      totalSignals: number;
      lastActivity: string;
    }[];
    summary: {
      totalStrategies: number;
      totalAllocatedCapital: number;
      totalUsedCapital: number;
    };
  };
}
```

**Data Source:** Database queries with calculations
- `strategies` table for basic strategy info
- `strategy_allocations` table for capital data
- `signals` table for activity metrics

### D.3 Live Trading Analytics

#### D.3.1 Live Trades Monitoring
```typescript
// GET /api/dashboard/trading/live
interface LiveTradesResponse {
  success: boolean;
  data: {
    trades: {
      id: string;
      symbol: string;
      side: 'buy' | 'sell';
      quantity: number;
      price: number;
      timestamp: string;
      strategy: string;
      status: 'filled' | 'pending' | 'cancelled';
      pnl?: number;
    }[];
    verification: {
      alpacaCount: number;
      databaseCount: number;
      discrepancies: any[];
    };
  };
}
```

**Data Sources:**
- Primary: Alpaca Trades API
- Verification: Database `executions` table
- Cross-reference for data integrity

#### D.3.2 Performance Analytics
```typescript
// GET /api/dashboard/analytics/performance
interface PerformanceAnalyticsResponse {
  success: boolean;
  data: {
    metrics: {
      totalReturn: number;
      sharpeRatio: number;
      maxDrawdown: number;
      winRate: number;
      profitFactor: number;
      averageWin: number;
      averageLoss: number;
    };
    timeSeriesData: {
      date: string;
      cumulativeReturn: number;
      drawdown: number;
    }[];
    strategyBreakdown: {
      strategyName: string;
      contribution: number;
      allocatedCapital: number;
    }[];
  };
}
```

**Data Source:** Database calculations
- Historical trades from `executions` table
- Portfolio snapshots from `strategy_capital_snapshots` table
- Performance metrics computed in backend

### D.4 Strategy Center

#### D.4.1 Strategy Management Hub
```typescript
// GET /api/dashboard/strategy-center
interface StrategyCenterResponse {
  success: boolean;
  data: {
    strategies: {
      id: number;
      name: string;
      description: string;
      parameters: Record<string, any>;
      allocations: {
        symbol: string;
        allocatedCapital: number;
        usedCapital: number;
        performance: number;
      }[];
      metrics: {
        totalTrades: number;
        winRate: number;
        avgReturn: number;
        lastBacktest: string;
      };
    }[];
  };
}
```

**Data Sources:**
- `strategies` table
- `strategy_parameters` table
- `strategy_allocations` table
- Calculated metrics from trading history

### D.5 Capital Management Center

#### D.5.1 Capital Pool Overview
```typescript
// GET /api/dashboard/capital/overview
interface CapitalOverviewResponse {
  success: boolean;
  data: {
    totalCapital: number;
    allocatedCapital: number;
    availableCapital: number;
    reservedCapital: number;
    allocations: {
      strategyId: number;
      strategyName: string;
      allocatedAmount: number;
      utilizedAmount: number;
      performance: number;
    }[];
    snapshots: {
      date: string;
      totalValue: number;
      allocatedValue: number;
    }[];
  };
}
```

**Data Sources:**
- `strategy_allocations` table
- `strategy_capital_snapshots` table
- Real-time calculations for current values

### D.6 Strategy Lab (Backtesting)

#### D.6.1 Create New Backtest
```typescript
// POST /api/dashboard/strategy-lab/backtest
interface CreateBacktestRequest {
  strategyName: string;
  symbols: string[];
  parameters: Record<string, any>;
  startDate: string;
  endDate: string;
  initialCapital: number;
}

interface CreateBacktestResponse {
  success: boolean;
  data: {
    backtestId: number;
    status: 'queued' | 'running';
    estimatedDuration: string;
  };
}
```

#### D.6.2 Backtest Results and Analytics
```typescript
// GET /api/dashboard/strategy-lab/results/[id]
interface BacktestResultsResponse {
  success: boolean;
  data: {
    metadata: {
      strategyName: string;
      symbols: string[];
      period: { start: string; end: string };
      parameters: Record<string, any>;
    };
    metrics: {
      totalReturn: number;
      sharpeRatio: number;
      maxDrawdown: number;
      totalTrades: number;
      winRate: number;
    };
    equityCurve: {
      date: string;
      portfolioValue: number;
      drawdown: number;
    }[];
    trades: {
      date: string;
      symbol: string;
      side: 'buy' | 'sell';
      quantity: number;
      price: number;
      pnl: number;
    }[];
    readyForApproval: boolean;
  };
}
```

**Data Sources:**
- External backtesting service (localhost:8000)
- Database storage of results in `backtests`, `backtest_runs`, `backtest_trades` tables

#### D.6.3 Available Strategies and Parameters
```typescript
// GET /api/dashboard/strategy-lab/resources
interface StrategyLabResourcesResponse {
  success: boolean;
  data: {
    availableStrategies: {
      name: string;
      description: string;
      parameters: {
        name: string;
        type: 'number' | 'string' | 'boolean';
        defaultValue: any;
        constraints?: {
          min?: number;
          max?: number;
          options?: string[];
        };
      }[];
    }[];
    availableSymbols: string[];
  };
}
```

**Data Sources:**
- `strategies` table
- `strategy_parameters` table  
- `symbols` table

### D.7 News Center

#### D.7.1 News Analysis Integration
```typescript
// POST /api/dashboard/news/analyze
interface NewsAnalysisRequest {
  newsUrl: string;
}

interface NewsAnalysisResponse {
  success: boolean;
  data: {
    analysisId: string;
    status: 'processing' | 'completed';
    summary?: string;
    sentiment?: 'bullish' | 'bearish' | 'neutral';
    relevantSymbols?: string[];
    marketImpact?: 'high' | 'medium' | 'low';
  };
}
```

**Data Source:** N8N workflow integration for news analysis

#### D.7.2 News Database Management
```typescript
// GET /api/dashboard/news/articles
interface NewsArticlesResponse {
  success: boolean;
  data: {
    articles: {
      id: number;
      title: string;
      url: string;
      publishedDate: string;
      sentiment: string;
      marketImpact: string;
      relevantSymbols: string[];
      analysis: string;
      createdAt: string;
    }[];
    pagination: {
      page: number;
      limit: number;
      total: number;
    };
  };
}
```

**Data Source:** `news_articles` table and related news database tables

### D.8 Control Center (Admin Dashboard)

#### D.8.1 User Management
```typescript
// GET /api/dashboard/control/users
interface UserManagementResponse {
  success: boolean;
  data: {
    users: {
      id: string;
      email: string;
      name: string;
      role: string;
      lastLogin: string;
      status: 'active' | 'suspended';
      createdAt: string;
    }[];
    statistics: {
      totalUsers: number;
      activeUsers: number;
      newUsersThisMonth: number;
    };
  };
}
```

**Data Source:** `users` table with Clerk user data synchronization

#### D.8.2 System Health Monitoring
```typescript
// GET /api/dashboard/control/system-health
interface SystemHealthResponse {
  success: boolean;
  data: {
    services: {
      name: string;
      status: 'healthy' | 'degraded' | 'down';
      latency: number;
      lastCheck: string;
    }[];
    infrastructure: {
      database: { status: string; connections: number; };
      railway: { status: string; deployment: string; };
      alpaca: { status: string; rateLimit: string; };
      backtesting: { status: string; queueSize: number; };
    };
    alerts: {
      level: 'info' | 'warning' | 'error';
      message: string;
      timestamp: string;
    }[];
  };
}
```

**Data Sources:**
- `system_health` table
- Railway API (deployment and infrastructure status)
- Health check endpoints for external services

#### D.8.3 Audit Trail
```typescript
// GET /api/dashboard/control/audit
interface AuditTrailResponse {
  success: boolean;
  data: {
    entries: {
      id: number;
      userId: string;
      action: string;
      entityType: string;
      entityId: string;
      changes: Record<string, any>;
      ipAddress: string;
      userAgent: string;
      timestamp: string;
    }[];
    filters: {
      users: string[];
      actions: string[];
      entityTypes: string[];
    };
    pagination: {
      page: number;
      limit: number;
      total: number;
    };
  };
}
```

**Data Source:** `audit_log` table with comprehensive activity tracking

### D.9 Implementation Notes

#### D.9.1 Data Refresh Strategies
- **Real-time data:** WebSocket connections for live trades and positions
- **Cached data:** 5-minute cache for portfolio performance, 1-minute for active positions
- **Historical data:** Daily refresh for performance analytics, on-demand for backtests

#### D.9.2 Error Handling
- Fallback mechanisms when Alpaca API is unavailable
- Data validation between Alpaca and database records
- Graceful degradation for non-critical dashboard components

#### D.9.3 Performance Optimization
- Database query optimization with proper indexing
- Pagination for large datasets (trades, news articles, audit logs)
- Background jobs for heavy calculations (performance metrics)
- Caching frequently accessed reference data (symbols, strategies)