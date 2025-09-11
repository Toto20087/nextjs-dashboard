import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { useAuth } from "@clerk/clerk-react";
import { env } from "node:process";

// Create axios instance with default configuration
const api: AxiosInstance = axios.create({
  baseURL: env.VITE_API_URL || "/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add authentication token
api.interceptors.request.use(
  (config) => {
    // In a client component, we'll need to get the token differently
    // This will be handled by the useApiClient hook
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for global error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.error("Unauthorized access - redirecting to login");
      // In Next.js, we'd typically redirect using the router
    } else if (error.response?.status >= 500) {
      // Handle server errors
      console.error("Server error:", error.response.data);
    }
    return Promise.reject(error);
  }
);

// Hook to use authenticated API client
export const useApiClient = () => {
  const { getToken } = useAuth();

  const authenticatedApi = axios.create({
    baseURL: env.VITE_API_URL || "/api",
    timeout: 10000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Add auth interceptor
  authenticatedApi.interceptors.request.use(
    async (config) => {
      try {
        const token = await getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error("Error getting auth token:", error);
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  return authenticatedApi;
};

// API service functions
export const apiService = {
  // Trading endpoints
  trading: {
    getPositions: () => api.get("/trading/positions"),
    getOrders: () => api.get("/trading/orders"),
    createOrder: (data: any) => api.post("/trading/orders", data),
    cancelOrder: (orderId: string) => api.delete(`/trading/orders/${orderId}`),
  },

  // Strategy endpoints
  strategies: {
    getAll: () => api.get("/strategies"),
    getById: (id: string) => api.get(`/strategies/${id}`),
    create: (data: any) => api.post("/strategies", data),
    update: (id: string, data: any) => api.put(`/strategies/${id}`, data),
    delete: (id: string) => api.delete(`/strategies/${id}`),
    backtest: (id: string, params: any) =>
      api.post(`/strategies/${id}/backtest`, params),
  },

  // Analytics endpoints
  analytics: {
    getPerformance: (params?: any) =>
      api.get("/analytics/performance", { params }),
    getRisk: () => api.get("/analytics/risk"),
    getMetrics: () => api.get("/analytics/metrics"),
  },

  // News endpoints
  news: {
    getLatest: (params?: any) => api.get("/news/latest", { params }),
    getSignals: () => api.get("/news/signals"),
  },

  // System endpoints
  system: {
    getHealth: () => api.get("/system/health"),
    getStatus: () => api.get("/system/status"),
  },
};

// Vector-BT specific API service
export const vectorBtService = {
  // Backtest endpoints
  backtests: {
    getHistory: () => api.get("/backtest/jobs"),
    getJobs: () => api.get("/backtest/jobs"),
    getJob: (jobId: string) => api.get(`/backtest/${jobId}`),
    runBacktest: (params: any) => api.post("/backtest", params),
    findBestTickers: (params: any) =>
      api.post("/backtest/find-best-tickers", params),
    walkForward: (params: any) => api.post("/backtest/walk-forward", params),
    getModularModes: () => api.get("/backtest/modular/modes"),
    getModularJob: (jobId: string) => api.get(`/backtest/modular/${jobId}`),
    // Keep runModular as alias for backward compatibility
    runModular: (params: any) => api.post("/backtest", params),
  },

  // Strategy endpoints
  strategies: {
    getAvailable: () => api.get("/strategies"),
    getParameterRanges: (strategy: string) =>
      api.get(`/parameter-ranges/${strategy}`),
    test: (params: any) => api.post("/strategies/test", params),
    optimize: (params: any) => api.post("/parameters/optimize", params),
    batchOptimize: (params: any) => api.post("/parameters/batch", params),
    getTemplates: () => api.get("/strategies/templates"),
    getInfo: (strategyName: string) =>
      api.get(`/strategies/info/${strategyName}`),
    getParameters: (strategyName: string) =>
      api.get(`/strategies/parameters/${strategyName}`),
  },

  // Job management endpoints
  jobs: {
    getActive: () => api.get("/jobs/active"),
    getCompleted: () => api.get("/jobs/completed"),
    getFailed: () => api.get("/jobs/failed"),
    getAll: () => api.get("/jobs/all"),
    getJob: (jobId: string) => api.get(`/jobs/${jobId}`),
    deleteJob: (jobId: string) => api.delete(`/jobs/${jobId}`),
    retryJob: (jobId: string) => api.post(`/jobs/${jobId}/retry`),
    deleteAll: () => api.delete("/jobs/"),
    getStatistics: () => api.get("/api/backtest/statistics"),
    getTypes: () => api.get("/jobs/types"),
    getPriorities: () => api.get("/jobs/priorities"),
  },

  // Indicators and signals
  indicators: {
    calculate: (params: any) => api.post("/indicators/calculate", params),
    getAvailable: () => api.get("/indicators/available"),
    batchCalculate: (params: any) => api.post("/indicators/batch", params),
  },

  signals: {
    generate: (params: any) => api.post("/signals/generate", params),
    getStrategies: () => api.get("/signals/strategies"),
    createEnsemble: (params: any) => api.post("/signals/ensemble", params),
    validate: (params: any) => api.post("/signals/validate", params),
  },

  // Universe and regime analysis
  universe: {
    getCurrent: () => api.get("/universe/current"),
    scan: (params: any) => api.post("/universe/scan", params),
    filter: (params: any) => api.post("/universe/filter", params),
    select: (params: any) => api.post("/universe/select", params),
    getSectors: () => api.get("/universe/sectors"),
    getPopular: () => api.get("/universe/popular"),
    validate: (params: any) => api.post("/universe/validate", params),
  },

  regime: {
    detect: (params: any) => api.post("/regime/detect", params),
    getCurrent: () => api.get("/regime/current"),
    getHistorical: (params: any) => api.post("/regime/historical", params),
    getMarketInfo: () => api.get("/regime/market"),
  },

  // System health and monitoring
  health: {
    check: () => api.get("/health"),
    getSystem: () => api.get("/health"),
  },

  // Session management
  session: {
    create: (params: any) => api.post("/session/create", params),
    getStatus: (sessionId: string) => api.get(`/session/${sessionId}/status`),
    delete: (sessionId: string) => api.delete(`/session/${sessionId}`),
    list: () => api.get("/session/list"),
    getResults: (sessionId: string) => api.get(`/session/${sessionId}/results`),
  },

  // Pipeline and templates
  pipeline: {
    run: (params: any) => api.post("/backtest/pipeline", params),
    getTemplates: () => api.get("/pipeline/templates"),
    executeTemplate: (params: any) =>
      api.post("/pipeline/execute-template", params),
  },

  // Cache management
  cache: {
    getStats: () => api.get("/cache/stats"),
    clear: () => api.post("/cache/clear"),
  },

  // Configuration
  config: {
    export: (params: any) => api.post("/export/configuration", params),
  },
};

export default api;
