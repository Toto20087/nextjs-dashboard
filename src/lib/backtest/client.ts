/**
 * Backtesting Service Client
 *
 * This client handles communication with the external backtesting service
 * running on localhost:8000 for strategy validation and testing
 */

import {
  BacktestRequest,
  BacktestResponse,
  BacktestStatus,
  BacktestResult,
} from "./types";

export class BacktestServiceClient {
  private baseUrl: string;
  private timeout: number;

  constructor(
    baseUrl: string = "http://localhost:8000",
    timeout: number = 30000
  ) {
    this.baseUrl = baseUrl.replace(/\/+$/, ""); // Remove trailing slashes
    this.timeout = timeout;
  }

  /**
   * Submit a new backtest request
   */
  async submitBacktest(request: BacktestRequest): Promise<BacktestResponse> {
    try {
      const response = await this.makeRequest("/api/backtest/unified", {
        method: "POST",
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new BacktestError(
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      throw new BacktestError(
        `Failed to submit backtest: ${this.getErrorMessage(error)}`
      );
    }
  }

  /**
   * Get backtest status
   */
  async getBacktestStatus(backtestId: string): Promise<BacktestStatus> {
    try {
      const response = await this.makeRequest(`/api/backtest/${backtestId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new BacktestError(`Backtest ${backtestId} not found`);
        }
        throw new BacktestError(
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      throw new BacktestError(
        `Failed to get backtest status: ${this.getErrorMessage(error)}`
      );
    }
  }

  /**
   * Get backtest results
   */
  async getBacktestResults(backtestId: string): Promise<BacktestResult> {
    try {
      const response = await this.makeRequest(
        `/api/backtest/${backtestId}/results`
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new BacktestError(
            `Backtest results for ${backtestId} not found`
          );
        }
        throw new BacktestError(
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      throw new BacktestError(
        `Failed to get backtest results: ${this.getErrorMessage(error)}`
      );
    }
  }

  /**
   * Cancel a running backtest
   */
  async cancelBacktest(
    backtestId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.makeRequest(`/api/backtest/${backtestId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new BacktestError(`Backtest ${backtestId} not found`);
        }
        throw new BacktestError(
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      throw new BacktestError(
        `Failed to cancel backtest: ${this.getErrorMessage(error)}`
      );
    }
  }

  /**
   * Get queue status
   */
  async getQueueStatus(): Promise<{
    queueSize: number;
    runningJobs: number;
    estimatedWaitTime: string;
    averageProcessingTime: string;
  }> {
    try {
      // Get all backtest jobs status
      const response = await this.makeRequest("/api/backtest/jobs");

      if (!response.ok) {
        throw new BacktestError(
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const allJobs = await response.json();

      // Calculate real queue metrics from job statuses
      const jobs = Array.isArray(allJobs) ? allJobs : allJobs.jobs || [];

      const pendingJobs = jobs.filter((job) =>
        ["pending", "queued", "waiting"].includes(job.status?.toLowerCase())
      );

      const runningJobs = jobs.filter((job) =>
        ["running", "processing", "active"].includes(job.status?.toLowerCase())
      );

      const completedJobs = jobs.filter(
        (job) => job.status?.toLowerCase() === "completed"
      );

      // Calculate average processing time from completed jobs
      let averageProcessingTime = "Unknown";
      if (completedJobs.length > 0) {
        const totalTime = completedJobs.reduce((acc, job) => {
          if (job.createdAt && job.completedAt) {
            const created = new Date(job.createdAt);
            const completed = new Date(job.completedAt);
            return acc + (completed.getTime() - created.getTime());
          }
          return acc;
        }, 0);

        if (totalTime > 0) {
          const avgMs = totalTime / completedJobs.length;
          const avgMinutes = Math.round(avgMs / (1000 * 60));
          averageProcessingTime = `${avgMinutes} minutes`;
        }
      }

      // Estimate wait time based on queue size and average processing time
      let estimatedWaitTime = "Unknown";
      if (pendingJobs.length > 0 && averageProcessingTime !== "Unknown") {
        const avgMinutes = parseInt(averageProcessingTime);
        const waitMinutes = pendingJobs.length * avgMinutes;
        estimatedWaitTime = `${waitMinutes} minutes`;
      } else if (pendingJobs.length === 0 && runningJobs.length === 0) {
        estimatedWaitTime = "0 minutes";
      }

      const runningJobsCount = runningJobs.length;

      return {
        queueSize: pendingJobs.length,
        runningJobs: runningJobsCount,
        estimatedWaitTime,
        averageProcessingTime,
      };
    } catch (error) {
      throw new BacktestError(
        `Failed to get queue status: ${this.getErrorMessage(error)}`
      );
    }
  }

  /**
   * Get available strategies
   */
  async getAvailableStrategies(): Promise<
    Array<{
      name: string;
      description: string;
      parameters: Array<{
        name: string;
        type: "number" | "string" | "boolean";
        defaultValue: any;
        constraints?: {
          min?: number;
          max?: number;
          options?: string[];
        };
        description?: string;
      }>;
    }>
  > {
    try {
      const response = await this.makeRequest("/api/strategies");

      if (!response.ok) {
        throw new BacktestError(
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      throw new BacktestError(
        `Failed to get available strategies: ${this.getErrorMessage(error)}`
      );
    }
  }

  /**
   * Get user's backtest history
   */
  async getBacktestHistory(
    params: {
      limit?: number;
      offset?: number;
      status?: "pending" | "running" | "completed" | "failed" | "cancelled";
      strategyName?: string;
    } = {}
  ): Promise<{
    backtests: Array<{
      id: string;
      strategyName: string;
      symbols: string[];
      status: string;
      createdAt: string;
      completedAt?: string;
      performance?: {
        totalReturn: number;
        sharpeRatio: number;
        maxDrawdown: number;
      };
    }>;
    pagination: {
      total: number;
      limit: number;
      offset: number;
    };
  }> {
    try {
      const queryParams = new URLSearchParams();

      if (params.limit) queryParams.append("limit", params.limit.toString());
      if (params.offset) queryParams.append("offset", params.offset.toString());
      if (params.status) queryParams.append("status", params.status);
      if (params.strategyName)
        queryParams.append("strategy", params.strategyName);

      const url = `/api/backtest/history${
        queryParams.toString() ? "?" + queryParams.toString() : ""
      }`;
      const response = await this.makeRequest(url);

      if (!response.ok) {
        throw new BacktestError(
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      throw new BacktestError(
        `Failed to get backtest history: ${this.getErrorMessage(error)}`
      );
    }
  }

  /**
   * Test connection to backtesting service
   */
  async testConnection(): Promise<{
    success: boolean;
    message: string;
    latency?: number;
    version?: string;
  }> {
    try {
      const start = Date.now();
      const response = await this.makeRequest("/api/health");
      const latency = Date.now() - start;

      if (!response.ok) {
        return {
          success: false,
          message: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();

      return {
        success: true,
        message: "Connected successfully",
        latency,
        version: data.version || "unknown",
      };
    } catch (error) {
      return {
        success: false,
        message: this.getErrorMessage(error),
      };
    }
  }

  /**
   * Get backtesting service metrics
   */
  async getServiceMetrics(): Promise<{
    totalBacktests: number;
    averageProcessingTime: number;
    successRate: number;
    queueSize: number;
    systemLoad: number;
    uptime: number;
  }> {
    try {
      const response = await this.makeRequest("/api/metrics");

      if (!response.ok) {
        throw new BacktestError(
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      throw new BacktestError(
        `Failed to get service metrics: ${this.getErrorMessage(error)}`
      );
    }
  }

  /**
   * Validate backtest request parameters
   */
  validateBacktestRequest(request: BacktestRequest): string[] {
    const errors: string[] = [];

    if (!request.strategyName || request.strategyName.trim() === "") {
      errors.push("Strategy name is required");
    }

    if (!request.symbols || request.symbols.length === 0) {
      errors.push("At least one symbol is required");
    }

    if (request.symbols) {
      for (const symbol of request.symbols) {
        if (!/^[A-Z]{1,5}$/.test(symbol)) {
          errors.push(`Invalid symbol format: ${symbol}`);
        }
      }
    }

    if (!request.startDate || !request.endDate) {
      errors.push("Start date and end date are required");
    }

    if (request.startDate && request.endDate) {
      const start = new Date(request.startDate);
      const end = new Date(request.endDate);

      if (start >= end) {
        errors.push("Start date must be before end date");
      }

      if (start > new Date()) {
        errors.push("Start date cannot be in the future");
      }

      const maxHistoryDays = 365 * 5; // 5 years
      const daysDiff =
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

      if (daysDiff > maxHistoryDays) {
        errors.push("Date range cannot exceed 5 years");
      }
    }

    if (request.initialCapital !== undefined && request.initialCapital <= 0) {
      errors.push("Initial capital must be greater than 0");
    }

    return errors;
  }

  /**
   * Poll for backtest completion
   */
  async pollForCompletion(
    backtestId: string,
    options: {
      interval?: number;
      maxAttempts?: number;
      onProgress?: (status: BacktestStatus) => void;
    } = {}
  ): Promise<BacktestResult> {
    const { interval = 5000, maxAttempts = 120, onProgress } = options; // Default: 10 minutes max

    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const status = await this.getBacktestStatus(backtestId);

        if (onProgress) {
          onProgress(status);
        }

        if (status.status === "completed") {
          return await this.getBacktestResults(backtestId);
        }

        if (status.status === "failed" || status.status === "cancelled") {
          throw new BacktestError(
            `Backtest ${status.status}: ${status.error || "Unknown error"}`
          );
        }

        await new Promise((resolve) => setTimeout(resolve, interval));
        attempts++;
      } catch (error) {
        if (error instanceof BacktestError) {
          throw error;
        }
        throw new BacktestError(
          `Polling failed: ${this.getErrorMessage(error)}`
        );
      }
    }

    throw new BacktestError(
      "Backtest polling timeout - operation may still be running"
    );
  }

  /**
   * Make HTTP request with timeout and error handling
   */
  private async makeRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Request timeout");
      }

      throw error;
    }
  }

  /**
   * Extract error message from various error types
   */
  private getErrorMessage(error: any): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === "string") {
      return error;
    }

    return "Unknown error occurred";
  }
}

/**
 * Custom error class for backtest-related errors
 */
export class BacktestError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = "BacktestError";

    if (originalError) {
      this.cause = originalError;
    }
  }
}

// Export singleton instance
export const backtestService = new BacktestServiceClient();
