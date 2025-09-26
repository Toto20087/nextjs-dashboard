/**
 * API Response and Error Types
 * 
 * This file contains standardized types for all API responses across the trading dashboard.
 * It ensures consistency in error handling and response structure.
 */

/**
 * Standard API Error structure used across all endpoints
 */
export interface ApiError {
  /** Error code for programmatic error handling (e.g., "UNAUTHORIZED", "NOT_FOUND") */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Optional additional error details or context */
  details?: string;
}

/**
 * Generic API Response wrapper
 * @template T The type of data returned on successful responses
 */
export interface ApiResponse<T = unknown> {
  /** Indicates if the request was successful */
  success: boolean;
  /** Response data (present when success is true) */
  data?: T;
  /** Error information (present when success is false) */
  error?: ApiError;
  /** Optional timestamp of the response */
  timestamp?: string;
}

/**
 * Pagination metadata for paginated responses
 */
export interface PaginationMeta {
  /** Number of items per page */
  limit: number;
  /** Current offset (starting position) */
  offset: number;
  /** Total number of items available */
  total: number;
  /** Whether there are more items beyond the current page */
  hasMore: boolean;
}

/**
 * Paginated response wrapper for endpoints that return lists of items
 * @template T The type of items in the paginated list
 */
export interface PaginatedResponse<T = unknown> {
  /** Indicates if the request was successful */
  success: boolean;
  /** Response data containing items and pagination info */
  data?: {
    /** Array of items for the current page */
    items: T[];
    /** Pagination metadata */
    pagination: PaginationMeta;
  };
  /** Error information (present when success is false) */
  error?: ApiError;
  /** Optional timestamp of the response */
  timestamp?: string;
}

/**
 * Individual validation error for a specific field
 */
export interface ValidationError {
  /** The field that failed validation */
  field: string;
  /** Validation error message for this field */
  message: string;
  /** Validation error code for programmatic handling */
  code: string;
}

/**
 * Common error codes used across the API
 */
export const API_ERROR_CODES = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  
  // Request Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_FIELD: 'MISSING_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  INVALID_DATE: 'INVALID_DATE',
  INVALID_DATE_RANGE: 'INVALID_DATE_RANGE',
  INVALID_ID: 'INVALID_ID',
  INVALID_SYMBOL: 'INVALID_SYMBOL',
  INVALID_PARAMETERS: 'INVALID_PARAMETERS',
  
  // Resource Management
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  
  // Business Logic
  STRATEGY_NOT_FOUND: 'STRATEGY_NOT_FOUND',
  STRATEGY_CONFIG_NOT_FOUND: 'STRATEGY_CONFIG_NOT_FOUND',
  NO_JOB_ID: 'NO_JOB_ID',
  INVALID_JOB_ID: 'INVALID_JOB_ID',
  
  // System & External Services
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  SERVICE_TIMEOUT: 'SERVICE_TIMEOUT',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  SYSTEM_HEALTH_ERROR: 'SYSTEM_HEALTH_ERROR',
  
  // Generic
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

/**
 * Type for API error codes
 */
export type ApiErrorCode = typeof API_ERROR_CODES[keyof typeof API_ERROR_CODES];

/**
 * Helper type for success responses
 */
export type SuccessResponse<T> = ApiResponse<T> & {
  success: true;
  data: T;
  error?: never;
};

/**
 * Helper type for error responses
 */
export type ErrorResponse = ApiResponse<never> & {
  success: false;
  data?: never;
  error: ApiError;
};