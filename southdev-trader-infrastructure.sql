-- Create extension "pg_trgm"
CREATE EXTENSION "pg_trgm" WITH SCHEMA "public" VERSION "1.6";
-- Create extension "btree_gin"
CREATE EXTENSION "btree_gin" WITH SCHEMA "public" VERSION "1.3";
-- Create "accounts" table
CREATE TABLE "accounts" (
  "id" serial NOT NULL,
  "user_id" integer NOT NULL,
  "provider" character varying(50) NOT NULL,
  "provider_account_id" character varying(255) NOT NULL,
  "access_token" text NULL,
  "refresh_token" text NULL,
  "id_token" text NULL,
  "token_type" character varying(50) NULL,
  "scope" text NULL,
  "expires_at" bigint NULL,
  "session_state" text NULL,
  "created_at" timestamptz NULL DEFAULT now(),
  "updated_at" timestamptz NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "accounts_provider_provider_account_id_key" UNIQUE ("provider", "provider_account_id")
);
-- Create index "idx_accounts_user" to table: "accounts"
CREATE INDEX "idx_accounts_user" ON "accounts" ("user_id");
-- Create "alerts" table
CREATE TABLE "alerts" (
  "id" serial NOT NULL,
  "alert_type" character varying(50) NOT NULL,
  "severity" character varying(20) NOT NULL,
  "title" character varying(200) NOT NULL,
  "message" text NOT NULL,
  "source_type" character varying(20) NULL,
  "source_id" character varying(50) NULL,
  "recipients" text[] NULL,
  "status" character varying(20) NULL DEFAULT 'active',
  "acknowledged_by" character varying(100) NULL,
  "acknowledged_at" timestamptz NULL,
  "resolved_by" character varying(100) NULL,
  "resolved_at" timestamptz NULL,
  "email_sent" boolean NULL DEFAULT false,
  "slack_sent" boolean NULL DEFAULT false,
  "sms_sent" boolean NULL DEFAULT false,
  "alert_data" jsonb NULL,
  "created_at" timestamptz NULL DEFAULT now(),
  "updated_at" timestamptz NULL DEFAULT now(),
  PRIMARY KEY ("id")
);
-- Create index "idx_alerts_created" to table: "alerts"
CREATE INDEX "idx_alerts_created" ON "alerts" ("created_at");
-- Create index "idx_alerts_severity" to table: "alerts"
CREATE INDEX "idx_alerts_severity" ON "alerts" ("severity");
-- Create index "idx_alerts_source" to table: "alerts"
CREATE INDEX "idx_alerts_source" ON "alerts" ("source_type", "source_id");
-- Create index "idx_alerts_status" to table: "alerts"
CREATE INDEX "idx_alerts_status" ON "alerts" ("status");
-- Create index "idx_alerts_type" to table: "alerts"
CREATE INDEX "idx_alerts_type" ON "alerts" ("alert_type");
-- Create "api_keys" table
CREATE TABLE "api_keys" (
  "id" serial NOT NULL,
  "key_id" character varying(100) NOT NULL,
  "key_hash" character varying(255) NOT NULL,
  "user_id" integer NOT NULL,
  "name" character varying(100) NOT NULL,
  "description" text NULL,
  "permissions" jsonb NOT NULL DEFAULT '[]',
  "allowed_ips" inet[] NULL,
  "allowed_origins" text[] NULL,
  "rate_limit_per_minute" integer NULL DEFAULT 60,
  "rate_limit_per_hour" integer NULL DEFAULT 1000,
  "last_used_at" timestamptz NULL,
  "last_used_ip" inet NULL,
  "usage_count" bigint NULL DEFAULT 0,
  "expires_at" timestamptz NULL,
  "is_active" boolean NULL DEFAULT true,
  "revoked_at" timestamptz NULL,
  "revoked_reason" text NULL,
  "created_at" timestamptz NULL DEFAULT now(),
  "updated_at" timestamptz NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "api_keys_key_id_key" UNIQUE ("key_id")
);
-- Create index "idx_api_keys_key_id" to table: "api_keys"
CREATE INDEX "idx_api_keys_key_id" ON "api_keys" ("key_id");
-- Create index "idx_api_keys_user" to table: "api_keys"
CREATE INDEX "idx_api_keys_user" ON "api_keys" ("user_id");
-- Create "api_rate_limits" table
CREATE TABLE "api_rate_limits" (
  "id" serial NOT NULL,
  "api_name" character varying(50) NOT NULL,
  "endpoint" character varying(255) NULL,
  "requests_per_minute" integer NOT NULL,
  "requests_per_hour" integer NULL,
  "requests_per_day" integer NULL,
  "current_minute_count" integer NULL DEFAULT 0,
  "current_hour_count" integer NULL DEFAULT 0,
  "current_day_count" integer NULL DEFAULT 0,
  "minute_reset_at" timestamptz NULL,
  "hour_reset_at" timestamptz NULL,
  "day_reset_at" timestamptz NULL,
  "is_rate_limited" boolean NULL DEFAULT false,
  "rate_limit_expires_at" timestamptz NULL,
  "created_at" timestamptz NULL DEFAULT now(),
  "updated_at" timestamptz NULL DEFAULT now(),
  PRIMARY KEY ("id")
);
-- Create index "idx_api_rate_limits_api" to table: "api_rate_limits"
CREATE INDEX "idx_api_rate_limits_api" ON "api_rate_limits" ("api_name");
-- Create index "idx_api_rate_limits_endpoint" to table: "api_rate_limits"
CREATE INDEX "idx_api_rate_limits_endpoint" ON "api_rate_limits" ("api_name", "endpoint");
-- Create index "idx_api_rate_limits_limited" to table: "api_rate_limits"
CREATE INDEX "idx_api_rate_limits_limited" ON "api_rate_limits" ("is_rate_limited");
-- Create "audit_actions" table
CREATE TABLE "audit_actions" (
  "id" serial NOT NULL,
  "user_id" integer NULL,
  "session_id" integer NULL,
  "api_key_id" integer NULL,
  "action_type" character varying(100) NOT NULL,
  "resource_type" character varying(50) NULL,
  "resource_id" character varying(100) NULL,
  "ip_address" inet NULL,
  "user_agent" text NULL,
  "request_method" character varying(10) NULL,
  "request_path" text NULL,
  "success" boolean NULL DEFAULT true,
  "error_code" character varying(50) NULL,
  "error_message" text NULL,
  "request_data" jsonb NULL,
  "response_data" jsonb NULL,
  "timestamp" timestamptz NULL DEFAULT now(),
  PRIMARY KEY ("id")
);
-- Create index "idx_audit_actions_resource" to table: "audit_actions"
CREATE INDEX "idx_audit_actions_resource" ON "audit_actions" ("resource_type", "resource_id");
-- Create index "idx_audit_actions_type" to table: "audit_actions"
CREATE INDEX "idx_audit_actions_type" ON "audit_actions" ("action_type", "timestamp");
-- Create index "idx_audit_actions_user" to table: "audit_actions"
CREATE INDEX "idx_audit_actions_user" ON "audit_actions" ("user_id", "timestamp");
-- Create "audit_log" table
CREATE TABLE "audit_log" (
  "id" bigserial NOT NULL,
  "actor" text NULL,
  "action" text NOT NULL,
  "context" jsonb NULL DEFAULT '{}',
  "created_at" timestamptz NULL DEFAULT now(),
  PRIMARY KEY ("id")
);
-- Create "authorization_codes" table
CREATE TABLE "authorization_codes" (
  "id" serial NOT NULL,
  "user_id" integer NULL,
  "code_hash" character varying(255) NOT NULL,
  "action_type" character varying(50) NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "used_at" timestamptz NULL,
  "used_for_action" character varying(100) NULL,
  "ip_address" inet NULL,
  "user_agent" text NULL,
  "created_at" timestamptz NULL DEFAULT now(),
  PRIMARY KEY ("id")
);
-- Create index "idx_authorization_codes_action" to table: "authorization_codes"
CREATE INDEX "idx_authorization_codes_action" ON "authorization_codes" ("action_type");
-- Create index "idx_authorization_codes_expiry" to table: "authorization_codes"
CREATE INDEX "idx_authorization_codes_expiry" ON "authorization_codes" ("expires_at");
-- Create index "idx_authorization_codes_user" to table: "authorization_codes"
CREATE INDEX "idx_authorization_codes_user" ON "authorization_codes" ("user_id");
-- Create "backtest_equity_curve" table
CREATE TABLE "backtest_equity_curve" (
  "id" bigserial NOT NULL,
  "timestamp" timestamptz NOT NULL,
  "run_id" integer NULL,
  "equity_value" numeric(15,2) NULL,
  "drawdown_pct" numeric(8,4) NULL,
  PRIMARY KEY ("id")
);
-- Create index "idx_equity_run_time" to table: "backtest_equity_curve"
CREATE INDEX "idx_equity_run_time" ON "backtest_equity_curve" ("run_id", "timestamp");
-- Create "backtest_metrics" table
CREATE TABLE "backtest_metrics" (
  "id" serial NOT NULL,
  "run_id" integer NULL,
  "total_return" numeric(10,6) NULL,
  "annualized_return" numeric(10,6) NULL,
  "sharpe_ratio" numeric(8,4) NULL,
  "sortino_ratio" numeric(8,4) NULL,
  "max_drawdown" numeric(10,6) NULL,
  "win_rate" numeric(5,4) NULL,
  "profit_factor" numeric(10,4) NULL,
  "total_trades" integer NULL,
  "winning_trades" integer NULL,
  "losing_trades" integer NULL,
  "avg_win" numeric(15,4) NULL,
  "avg_loss" numeric(15,4) NULL,
  "best_trade" numeric(15,4) NULL,
  "worst_trade" numeric(15,4) NULL,
  "avg_trade_duration" interval NULL,
  "total_commission" numeric(15,2) NULL,
  "net_profit" numeric(15,2) NULL,
  PRIMARY KEY ("id")
);
-- Create "backtest_runs" table
CREATE TABLE "backtest_runs" (
  "id" serial NOT NULL,
  "job_id" uuid NOT NULL,
  "backtest_symbols" integer NULL,
  "start_date" date NOT NULL,
  "end_date" date NOT NULL,
  "initial_capital" numeric(15,2) NOT NULL,
  "status" character varying(20) NULL DEFAULT 'running',
  "created_at" timestamptz NULL DEFAULT now(),
  "completed_at" timestamptz NULL,
  "strategy_id" integer NULL,
  "strategy_config" jsonb NOT NULL,
  PRIMARY KEY ("id")
);
-- Create "backtest_symbols" table
CREATE TABLE "backtest_symbols" (
  "id" serial NOT NULL,
  "backtest_id" integer NULL,
  "symbol" integer NULL,
  PRIMARY KEY ("id")
);
-- Create "backtest_trades" table
CREATE TABLE "backtest_trades" (
  "id" bigserial NOT NULL,
  "run_id" integer NULL,
  "symbol" integer NULL,
  "timestamp" timestamptz NOT NULL,
  "side" character varying(4) NOT NULL,
  "quantity" numeric(15,8) NOT NULL,
  "price" numeric(15,4) NOT NULL,
  "value" numeric(15,2) NOT NULL,
  "commission" numeric(10,2) NULL DEFAULT 0,
  "pnl" numeric(15,2) NULL,
  "cumulative_pnl" numeric(15,2) NULL,
  "position_size" numeric(15,8) NULL,
  PRIMARY KEY ("id")
);
-- Create index "idx_trades_run_symbol" to table: "backtest_trades"
CREATE INDEX "idx_trades_run_symbol" ON "backtest_trades" ("run_id", "symbol");
-- Create index "idx_trades_timestamp" to table: "backtest_trades"
CREATE INDEX "idx_trades_timestamp" ON "backtest_trades" ("timestamp");
-- Create "backtests" table
CREATE TABLE "backtests" (
  "id" serial NOT NULL,
  "strategy_id" integer NOT NULL,
  "config" jsonb NOT NULL,
  "period_start" date NOT NULL,
  "period_end" date NOT NULL,
  "total_return" numeric(7,4) NULL,
  "sharpe_ratio" numeric(5,2) NULL,
  "max_drawdown" numeric(7,4) NULL,
  "total_trades" integer NULL,
  "win_rate" numeric(5,2) NULL,
  "created_at" timestamptz NULL DEFAULT now(),
  PRIMARY KEY ("id")
);
-- Create index "idx_backtests_created" to table: "backtests"
CREATE INDEX "idx_backtests_created" ON "backtests" ("created_at");
-- Create index "idx_backtests_strategy" to table: "backtests"
CREATE INDEX "idx_backtests_strategy" ON "backtests" ("strategy_id");
-- Create "broker_sync_status" table
CREATE TABLE "broker_sync_status" (
  "id" serial NOT NULL,
  "sync_type" character varying(50) NOT NULL,
  "last_sync_timestamp" timestamptz NULL,
  "next_sync_timestamp" timestamptz NULL,
  "sync_frequency_minutes" integer NULL DEFAULT 5,
  "status" character varying(20) NULL DEFAULT 'pending',
  "error_message" text NULL,
  "retry_count" integer NULL DEFAULT 0,
  "sync_data" jsonb NULL,
  "created_at" timestamptz NULL DEFAULT now(),
  "updated_at" timestamptz NULL DEFAULT now(),
  PRIMARY KEY ("id")
);
-- Create index "idx_broker_sync_status_next_sync" to table: "broker_sync_status"
CREATE INDEX "idx_broker_sync_status_next_sync" ON "broker_sync_status" ("next_sync_timestamp");
-- Create index "idx_broker_sync_status_status" to table: "broker_sync_status"
CREATE INDEX "idx_broker_sync_status_status" ON "broker_sync_status" ("status");
-- Create index "idx_broker_sync_status_type" to table: "broker_sync_status"
CREATE INDEX "idx_broker_sync_status_type" ON "broker_sync_status" ("sync_type");
-- Create "emergency_halts" table
CREATE TABLE "emergency_halts" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "halt_type" character varying(50) NOT NULL,
  "initiated_by" integer NULL,
  "reason" text NOT NULL,
  "scope" character varying(20) NOT NULL,
  "scope_details" jsonb NULL,
  "is_active" boolean NULL DEFAULT true,
  "resolved_at" timestamptz NULL,
  "resolved_by" integer NULL,
  "resolution_notes" text NULL,
  "halt_data" jsonb NULL,
  "created_at" timestamptz NULL DEFAULT now(),
  PRIMARY KEY ("id")
);
-- Create index "idx_emergency_halts_active" to table: "emergency_halts"
CREATE INDEX "idx_emergency_halts_active" ON "emergency_halts" ("is_active");
-- Create index "idx_emergency_halts_created" to table: "emergency_halts"
CREATE INDEX "idx_emergency_halts_created" ON "emergency_halts" ("created_at");
-- Create index "idx_emergency_halts_initiator" to table: "emergency_halts"
CREATE INDEX "idx_emergency_halts_initiator" ON "emergency_halts" ("initiated_by");
-- Create index "idx_emergency_halts_type" to table: "emergency_halts"
CREATE INDEX "idx_emergency_halts_type" ON "emergency_halts" ("halt_type");
-- Create "executions" table
CREATE TABLE "executions" (
  "id" bigserial NOT NULL,
  "execution_id" text NOT NULL,
  "order_id" text NULL,
  "position_id" bigint NULL,
  "symbol_id" integer NOT NULL,
  "symbol" text NOT NULL,
  "side" text NOT NULL,
  "quantity" numeric(15,6) NOT NULL,
  "price" numeric(15,2) NOT NULL,
  "commission" numeric(10,2) NULL,
  "fees" numeric(10,2) NULL,
  "total_cost" numeric(15,2) NULL,
  "executed_at" timestamptz NOT NULL,
  "settled_at" timestamptz NULL,
  "venue" text NULL,
  "execution_type" text NULL,
  "metadata" jsonb NULL,
  "created_at" timestamptz NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "executions_execution_id_key" UNIQUE ("execution_id")
);
-- Create index "idx_executions_order" to table: "executions"
CREATE INDEX "idx_executions_order" ON "executions" ("order_id");
-- Create index "idx_executions_position" to table: "executions"
CREATE INDEX "idx_executions_position" ON "executions" ("position_id");
-- Create index "idx_executions_time" to table: "executions"
CREATE INDEX "idx_executions_time" ON "executions" ("executed_at");
-- Create "feature_flags" table
CREATE TABLE "feature_flags" (
  "id" serial NOT NULL,
  "feature_name" character varying(100) NOT NULL,
  "is_enabled" boolean NULL DEFAULT false,
  "rollout_percentage" numeric(5,2) NULL DEFAULT 0,
  "target_users" text[] NULL,
  "target_roles" text[] NULL,
  "description" text NULL,
  "created_by" character varying(100) NULL,
  "is_active" boolean NULL DEFAULT true,
  "created_at" timestamptz NULL DEFAULT now(),
  "updated_at" timestamptz NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "feature_flags_feature_name_key" UNIQUE ("feature_name")
);
-- Create index "idx_feature_flags_active" to table: "feature_flags"
CREATE INDEX "idx_feature_flags_active" ON "feature_flags" ("is_active");
-- Create index "idx_feature_flags_enabled" to table: "feature_flags"
CREATE INDEX "idx_feature_flags_enabled" ON "feature_flags" ("is_enabled");
-- Create index "idx_feature_flags_name" to table: "feature_flags"
CREATE INDEX "idx_feature_flags_name" ON "feature_flags" ("feature_name");
-- Create "global_market_regime" table
CREATE TABLE "global_market_regime" (
  "id" serial NOT NULL,
  "current_regime_id" integer NOT NULL,
  "regime_confidence" numeric(5,2) NOT NULL,
  "spy_return_20d" numeric(7,4) NULL,
  "spy_volatility_20d" numeric(7,4) NULL,
  "vix_level" numeric(7,2) NULL,
  "volume_ratio" numeric(5,2) NULL,
  "regime_start_date" timestamptz NOT NULL,
  "previous_regime_id" integer NULL,
  "regime_duration_hours" integer NULL,
  "detection_algorithm" character varying(50) NULL DEFAULT 'rust_spy_analysis',
  "last_analysis_timestamp" timestamptz NULL DEFAULT now(),
  "next_analysis_scheduled" timestamptz NULL,
  "created_at" timestamptz NULL DEFAULT now(),
  "updated_at" timestamptz NULL DEFAULT now(),
  PRIMARY KEY ("id")
);
-- Create index "idx_global_regime_analysis" to table: "global_market_regime"
CREATE INDEX "idx_global_regime_analysis" ON "global_market_regime" ("last_analysis_timestamp");
-- Create index "idx_global_regime_current" to table: "global_market_regime"
CREATE INDEX "idx_global_regime_current" ON "global_market_regime" ("current_regime_id");
-- Create "login_history" table
CREATE TABLE "login_history" (
  "id" serial NOT NULL,
  "user_id" integer NULL,
  "email" character varying(255) NULL,
  "success" boolean NOT NULL,
  "failure_reason" character varying(100) NULL,
  "auth_method" character varying(50) NULL,
  "ip_address" inet NULL,
  "country" character varying(2) NULL,
  "region" character varying(100) NULL,
  "city" character varying(100) NULL,
  "user_agent" text NULL,
  "device_type" character varying(50) NULL,
  "browser" character varying(50) NULL,
  "os" character varying(50) NULL,
  "is_suspicious" boolean NULL DEFAULT false,
  "risk_score" numeric(3,2) NULL,
  "timestamp" timestamptz NULL DEFAULT now(),
  PRIMARY KEY ("id")
);
-- Create index "idx_login_history_email" to table: "login_history"
CREATE INDEX "idx_login_history_email" ON "login_history" ("email", "timestamp");
-- Create index "idx_login_history_suspicious" to table: "login_history"
CREATE INDEX "idx_login_history_suspicious" ON "login_history" ("is_suspicious", "timestamp");
-- Create index "idx_login_history_user" to table: "login_history"
CREATE INDEX "idx_login_history_user" ON "login_history" ("user_id", "timestamp");
-- Create "market_data" table
CREATE TABLE "market_data" (
  "id" serial NOT NULL,
  "symbol_id" integer NOT NULL,
  "symbol" character varying(10) NOT NULL,
  "timestamp" timestamptz NOT NULL,
  "open" numeric(15,2) NULL,
  "high" numeric(15,2) NULL,
  "low" numeric(15,2) NULL,
  "close" numeric(15,2) NULL,
  "volume" bigint NULL,
  "vwap" numeric(15,2) NULL,
  "trade_count" integer NULL,
  "data_source" character varying(50) NULL DEFAULT 'polygon',
  "timeframe" character varying(10) NOT NULL,
  "created_at" timestamptz NULL DEFAULT now(),
  PRIMARY KEY ("id")
);
-- Create index "idx_market_data_symbol_text" to table: "market_data"
CREATE INDEX "idx_market_data_symbol_text" ON "market_data" ("symbol");
-- Create index "idx_market_data_symbol_time" to table: "market_data"
CREATE INDEX "idx_market_data_symbol_time" ON "market_data" ("symbol_id", "timeframe", "timestamp");
-- Create index "idx_market_data_timeframe" to table: "market_data"
CREATE INDEX "idx_market_data_timeframe" ON "market_data" ("timeframe", "timestamp");
-- Create index "idx_market_data_timestamp" to table: "market_data"
CREATE INDEX "idx_market_data_timestamp" ON "market_data" ("timestamp");
-- Create "market_sessions" table
CREATE TABLE "market_sessions" (
  "id" serial NOT NULL,
  "session_name" character varying(50) NOT NULL,
  "start_time_utc" time NOT NULL,
  "end_time_utc" time NOT NULL,
  "timezone" character varying(50) NULL DEFAULT 'America/New_York',
  "is_primary_session" boolean NULL DEFAULT false,
  "liquidity_factor" numeric(3,2) NULL DEFAULT 1.0,
  "risk_multiplier" numeric(3,2) NULL DEFAULT 1.0,
  "active_days" integer[] NULL,
  "is_active" boolean NULL DEFAULT true,
  "created_at" timestamptz NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "market_sessions_session_name_key" UNIQUE ("session_name")
);
-- Create index "idx_market_sessions_primary" to table: "market_sessions"
CREATE INDEX "idx_market_sessions_primary" ON "market_sessions" ("is_primary_session");
-- Create "market_status" table
CREATE TABLE "market_status" (
  "id" serial NOT NULL,
  "market" character varying(20) NOT NULL,
  "status" character varying(20) NOT NULL,
  "session_start" timestamptz NULL,
  "session_end" timestamptz NULL,
  "pre_market_start" timestamptz NULL,
  "pre_market_end" timestamptz NULL,
  "after_hours_start" timestamptz NULL,
  "after_hours_end" timestamptz NULL,
  "is_holiday" boolean NULL DEFAULT false,
  "holiday_name" character varying(100) NULL,
  "early_close" boolean NULL DEFAULT false,
  "early_close_time" timestamptz NULL,
  "notes" text NULL,
  "last_updated" timestamptz NULL DEFAULT now(),
  PRIMARY KEY ("id")
);
-- Create "monte_carlo_results" table
CREATE TABLE "monte_carlo_results" (
  "id" serial NOT NULL,
  "strategy_id" integer NOT NULL,
  "num_simulations" integer NOT NULL,
  "simulation_days" integer NOT NULL,
  "confidence_level" numeric(3,2) NOT NULL,
  "expected_return" numeric(7,4) NULL,
  "var_estimate" numeric(15,2) NULL,
  "expected_shortfall" numeric(15,2) NULL,
  "max_drawdown_95" numeric(7,4) NULL,
  "probability_of_loss" numeric(5,2) NULL,
  "return_distribution" jsonb NULL,
  "created_at" timestamptz NULL DEFAULT now(),
  PRIMARY KEY ("id")
);
-- Create index "idx_monte_carlo_created" to table: "monte_carlo_results"
CREATE INDEX "idx_monte_carlo_created" ON "monte_carlo_results" ("created_at");
-- Create index "idx_monte_carlo_strategy" to table: "monte_carlo_results"
CREATE INDEX "idx_monte_carlo_strategy" ON "monte_carlo_results" ("strategy_id");
-- Create "news_articles" table
CREATE TABLE "news_articles" (
  "id" serial NOT NULL,
  "external_id" character varying(255) NULL,
  "title" text NOT NULL,
  "content" text NULL,
  "source" character varying(100) NULL,
  "url" text NULL,
  "published_at" timestamptz NULL,
  "category" character varying(50) NULL,
  "sentiment_score" numeric(3,2) NULL,
  "confidence_score" numeric(3,2) NULL,
  "relevance_score" numeric(3,2) NULL,
  "impact_score" numeric(3,2) NULL,
  "processed" boolean NULL DEFAULT false,
  "processed_at" timestamptz NULL,
  "tags" text[] NULL,
  "metadata" jsonb NULL,
  "created_at" timestamptz NULL DEFAULT now(),
  "symbol_id" integer NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "news_articles_external_id_key" UNIQUE ("external_id")
);
-- Create index "idx_news_articles_symbol" to table: "news_articles"
CREATE INDEX "idx_news_articles_symbol" ON "news_articles" ("symbol_id");
-- Create index "idx_news_articles_symbol_published" to table: "news_articles"
CREATE INDEX "idx_news_articles_symbol_published" ON "news_articles" ("symbol_id", "published_at" DESC);
-- Create index "idx_news_category" to table: "news_articles"
CREATE INDEX "idx_news_category" ON "news_articles" ("category");
-- Create index "idx_news_external_id" to table: "news_articles"
CREATE INDEX "idx_news_external_id" ON "news_articles" ("external_id");
-- Create index "idx_news_processed" to table: "news_articles"
CREATE INDEX "idx_news_processed" ON "news_articles" ("processed");
-- Create index "idx_news_published" to table: "news_articles"
CREATE INDEX "idx_news_published" ON "news_articles" ("published_at");
-- Create index "idx_news_sentiment" to table: "news_articles"
CREATE INDEX "idx_news_sentiment" ON "news_articles" ("sentiment_score");
-- Create index "idx_news_tags" to table: "news_articles"
CREATE INDEX "idx_news_tags" ON "news_articles" USING gin ("tags");
-- Create "orders" table
CREATE TABLE "orders" (
  "id" bigserial NOT NULL,
  "signal_id" uuid NULL,
  "symbol_id" integer NOT NULL,
  "status" text NOT NULL DEFAULT 'pending',
  "limit_price" numeric(20,8) NULL,
  "filled_price" numeric(20,8) NULL,
  "filled_quantity" numeric(20,8) NULL DEFAULT 0,
  "realized_pnl" numeric(20,8) NULL,
  "created_at" timestamptz NULL DEFAULT now(),
  "filled_at" timestamptz NULL,
  PRIMARY KEY ("id")
);
-- Create index "idx_orders_status" to table: "orders"
CREATE INDEX "idx_orders_status" ON "orders" ("status", "created_at") WHERE (status = ANY (ARRAY['pending'::text, 'submitted'::text, 'partially_filled'::text]));
-- Create "performance_metrics" table
CREATE TABLE "performance_metrics" (
  "id" serial NOT NULL,
  "metric_type" character varying(50) NOT NULL,
  "entity_id" character varying(50) NULL,
  "period_start" timestamptz NOT NULL,
  "period_end" timestamptz NOT NULL,
  "total_return" numeric(7,4) NULL,
  "annualized_return" numeric(7,4) NULL,
  "volatility" numeric(7,4) NULL,
  "sharpe_ratio" numeric(5,2) NULL,
  "max_drawdown" numeric(7,4) NULL,
  "total_trades" integer NULL,
  "win_rate" numeric(5,2) NULL,
  "avg_trade_duration" interval NULL,
  "var_95" numeric(15,2) NULL,
  "beta" numeric(5,2) NULL,
  "alpha" numeric(5,2) NULL,
  "custom_metrics" jsonb NULL,
  "created_at" timestamptz NULL DEFAULT now(),
  PRIMARY KEY ("id")
);
-- Create index "idx_performance_metrics_created" to table: "performance_metrics"
CREATE INDEX "idx_performance_metrics_created" ON "performance_metrics" ("created_at");
-- Create index "idx_performance_metrics_entity" to table: "performance_metrics"
CREATE INDEX "idx_performance_metrics_entity" ON "performance_metrics" ("metric_type", "entity_id");
-- Create index "idx_performance_metrics_period" to table: "performance_metrics"
CREATE INDEX "idx_performance_metrics_period" ON "performance_metrics" ("period_start", "period_end");
-- Create "permissions" table
CREATE TABLE "permissions" (
  "id" serial NOT NULL,
  "resource" character varying(50) NOT NULL,
  "action" character varying(50) NOT NULL,
  "description" text NULL,
  "scope" character varying(20) NULL DEFAULT 'global',
  "risk_level" character varying(20) NULL DEFAULT 'low',
  "requires_2fa" boolean NULL DEFAULT false,
  "is_active" boolean NULL DEFAULT true,
  "created_at" timestamptz NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "permissions_resource_action_scope_key" UNIQUE ("resource", "action", "scope")
);
-- Create "position_limits" table
CREATE TABLE "position_limits" (
  "id" serial NOT NULL,
  "entity_type" character varying(20) NOT NULL,
  "entity_id" character varying(50) NOT NULL,
  "max_position_size" numeric(15,2) NULL,
  "max_position_amount" numeric(15,2) NULL,
  "max_sector_exposure" numeric(5,2) NULL,
  "max_correlation" numeric(3,2) NULL,
  "is_active" boolean NULL DEFAULT true,
  "created_at" timestamptz NULL DEFAULT now(),
  "updated_at" timestamptz NULL DEFAULT now(),
  PRIMARY KEY ("id")
);
-- Create index "idx_position_limits_active" to table: "position_limits"
CREATE INDEX "idx_position_limits_active" ON "position_limits" ("is_active");
-- Create index "idx_position_limits_entity" to table: "position_limits"
CREATE INDEX "idx_position_limits_entity" ON "position_limits" ("entity_type", "entity_id");
-- Create "positions" table
CREATE TABLE "positions" (
  "id" bigserial NOT NULL,
  "strategy_id" integer NULL,
  "symbol_id" integer NOT NULL,
  "quantity" numeric(20,8) NOT NULL DEFAULT 0,
  "avg_price" numeric(20,8) NULL,
  "is_active" boolean NULL DEFAULT true,
  "updated_at" timestamptz NULL DEFAULT now(),
  "created_at" timestamptz NULL DEFAULT now(),
  PRIMARY KEY ("id")
);
-- Create index "idx_positions_active" to table: "positions"
CREATE INDEX "idx_positions_active" ON "positions" ("strategy_id", "symbol_id") WHERE (is_active = true);
-- Create "regime_types" table
CREATE TABLE "regime_types" (
  "id" integer NOT NULL,
  "name" character varying(50) NOT NULL,
  "description" text NULL,
  "is_active" boolean NULL DEFAULT true,
  "created_at" timestamptz NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "regime_types_name_key" UNIQUE ("name")
);
-- Create "risk_alert_history" table
CREATE TABLE "risk_alert_history" (
  "id" serial NOT NULL,
  "risk_alert_id" integer NOT NULL,
  "previous_status" character varying(20) NOT NULL,
  "new_status" character varying(20) NOT NULL,
  "changed_by" character varying(100) NULL,
  "change_reason" text NULL,
  "created_at" timestamptz NULL DEFAULT now(),
  PRIMARY KEY ("id")
);
-- Create index "idx_risk_alert_history_alert" to table: "risk_alert_history"
CREATE INDEX "idx_risk_alert_history_alert" ON "risk_alert_history" ("risk_alert_id");
-- Create index "idx_risk_alert_history_created" to table: "risk_alert_history"
CREATE INDEX "idx_risk_alert_history_created" ON "risk_alert_history" ("created_at");
-- Create "risk_alerts" table
CREATE TABLE "risk_alerts" (
  "id" serial NOT NULL,
  "alert_type" character varying(50) NOT NULL,
  "severity" character varying(20) NOT NULL,
  "entity_type" character varying(20) NOT NULL,
  "entity_id" character varying(50) NOT NULL,
  "current_value" numeric(15,2) NULL,
  "threshold_value" numeric(15,2) NULL,
  "breach_percentage" numeric(7,4) NULL,
  "status" character varying(20) NULL DEFAULT 'active',
  "acknowledged_by" character varying(100) NULL,
  "acknowledged_at" timestamptz NULL,
  "alert_data" jsonb NULL,
  "created_at" timestamptz NULL DEFAULT now(),
  PRIMARY KEY ("id")
);
-- Create index "idx_risk_alerts_entity" to table: "risk_alerts"
CREATE INDEX "idx_risk_alerts_entity" ON "risk_alerts" ("entity_type", "entity_id");
-- Create index "idx_risk_alerts_severity" to table: "risk_alerts"
CREATE INDEX "idx_risk_alerts_severity" ON "risk_alerts" ("severity");
-- Create index "idx_risk_alerts_status" to table: "risk_alerts"
CREATE INDEX "idx_risk_alerts_status" ON "risk_alerts" ("status");
-- Create index "idx_risk_alerts_type" to table: "risk_alerts"
CREATE INDEX "idx_risk_alerts_type" ON "risk_alerts" ("alert_type");
-- Create "notify_risk_alert" function
CREATE FUNCTION "notify_risk_alert" () RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM pg_notify('risk_alerts', COALESCE(NEW.id::text, ''));
  RETURN NEW;
END;
$$;
-- Create trigger "risk_alerts_notify_trg"
CREATE TRIGGER "risk_alerts_notify_trg" AFTER INSERT ON "risk_alerts" FOR EACH ROW EXECUTE FUNCTION "notify_risk_alert"();
-- Create "risk_control_actions" table
CREATE TABLE "risk_control_actions" (
  "id" serial NOT NULL,
  "action_type" character varying(50) NOT NULL,
  "initiated_by" integer NULL,
  "target_type" character varying(20) NOT NULL,
  "target_id" character varying(50) NOT NULL,
  "action_data" jsonb NOT NULL,
  "reason" text NOT NULL,
  "status" character varying(20) NULL DEFAULT 'pending',
  "executed_at" timestamptz NULL,
  "execution_result" jsonb NULL,
  "requires_approval" boolean NULL DEFAULT false,
  "approved_by" integer NULL,
  "approved_at" timestamptz NULL,
  "created_at" timestamptz NULL DEFAULT now(),
  PRIMARY KEY ("id")
);
-- Create index "idx_risk_control_actions_initiator" to table: "risk_control_actions"
CREATE INDEX "idx_risk_control_actions_initiator" ON "risk_control_actions" ("initiated_by");
-- Create index "idx_risk_control_actions_status" to table: "risk_control_actions"
CREATE INDEX "idx_risk_control_actions_status" ON "risk_control_actions" ("status");
-- Create index "idx_risk_control_actions_target" to table: "risk_control_actions"
CREATE INDEX "idx_risk_control_actions_target" ON "risk_control_actions" ("target_type", "target_id");
-- Create index "idx_risk_control_actions_type" to table: "risk_control_actions"
CREATE INDEX "idx_risk_control_actions_type" ON "risk_control_actions" ("action_type");
-- Create "risk_events" table
CREATE TABLE "risk_events" (
  "id" serial NOT NULL,
  "event_type" character varying(50) NOT NULL,
  "severity" character varying(20) NOT NULL,
  "source_type" character varying(20) NULL,
  "source_id" character varying(50) NULL,
  "risk_limit_id" integer NULL,
  "current_value" numeric(15,2) NULL,
  "limit_value" numeric(15,2) NULL,
  "breach_percentage" numeric(7,4) NULL,
  "action_taken" character varying(100) NULL,
  "resolved_at" timestamptz NULL,
  "resolved_by" character varying(100) NULL,
  "event_data" jsonb NULL,
  "notes" text NULL,
  "created_at" timestamptz NULL DEFAULT now(),
  PRIMARY KEY ("id")
);
-- Create index "idx_risk_events_resolved" to table: "risk_events"
CREATE INDEX "idx_risk_events_resolved" ON "risk_events" ("resolved_at");
-- Create index "idx_risk_events_severity" to table: "risk_events"
CREATE INDEX "idx_risk_events_severity" ON "risk_events" ("severity");
-- Create index "idx_risk_events_source" to table: "risk_events"
CREATE INDEX "idx_risk_events_source" ON "risk_events" ("source_type", "source_id");
-- Create index "idx_risk_events_time" to table: "risk_events"
CREATE INDEX "idx_risk_events_time" ON "risk_events" ("created_at");
-- Create index "idx_risk_events_type" to table: "risk_events"
CREATE INDEX "idx_risk_events_type" ON "risk_events" ("event_type");
-- Create "risk_limits" table
CREATE TABLE "risk_limits" (
  "id" serial NOT NULL,
  "scope_type" character varying(20) NOT NULL,
  "scope_id" character varying(50) NULL,
  "limit_type" character varying(50) NOT NULL,
  "limit_value" numeric(15,2) NOT NULL,
  "warning_threshold" numeric(15,2) NULL,
  "is_active" boolean NULL DEFAULT true,
  "is_breached" boolean NULL DEFAULT false,
  "breach_count" integer NULL DEFAULT 0,
  "last_breach_time" timestamptz NULL,
  "enforcement_action" character varying(50) NULL DEFAULT 'alert',
  "override_allowed" boolean NULL DEFAULT false,
  "created_at" timestamptz NULL DEFAULT now(),
  "updated_at" timestamptz NULL DEFAULT now(),
  PRIMARY KEY ("id")
);
-- Create index "idx_risk_limits_active" to table: "risk_limits"
CREATE INDEX "idx_risk_limits_active" ON "risk_limits" ("is_active");
-- Create index "idx_risk_limits_breached" to table: "risk_limits"
CREATE INDEX "idx_risk_limits_breached" ON "risk_limits" ("is_breached");
-- Create index "idx_risk_limits_scope" to table: "risk_limits"
CREATE INDEX "idx_risk_limits_scope" ON "risk_limits" ("scope_type", "scope_id");
-- Create index "idx_risk_limits_type" to table: "risk_limits"
CREATE INDEX "idx_risk_limits_type" ON "risk_limits" ("limit_type");
-- Create "risk_metrics" table
CREATE TABLE "risk_metrics" (
  "id" serial NOT NULL,
  "entity_type" character varying(20) NOT NULL,
  "entity_id" character varying(50) NOT NULL,
  "calculation_date" date NOT NULL,
  "var_95" numeric(15,2) NULL,
  "var_99" numeric(15,2) NULL,
  "expected_shortfall" numeric(15,2) NULL,
  "max_drawdown" numeric(7,4) NULL,
  "volatility" numeric(7,4) NULL,
  "beta" numeric(5,2) NULL,
  "largest_position_pct" numeric(5,2) NULL,
  "top_5_positions_pct" numeric(5,2) NULL,
  "sector_concentration" jsonb NULL,
  "portfolio_correlation" numeric(3,2) NULL,
  "market_correlation" numeric(3,2) NULL,
  "created_at" timestamptz NULL DEFAULT now(),
  PRIMARY KEY ("id")
);
-- Create index "idx_risk_metrics_date" to table: "risk_metrics"
CREATE INDEX "idx_risk_metrics_date" ON "risk_metrics" ("calculation_date");
-- Create index "idx_risk_metrics_entity" to table: "risk_metrics"
CREATE INDEX "idx_risk_metrics_entity" ON "risk_metrics" ("entity_type", "entity_id");
-- Create "roles" table
CREATE TABLE "roles" (
  "id" serial NOT NULL,
  "name" character varying(50) NOT NULL,
  "display_name" character varying(100) NOT NULL,
  "description" text NULL,
  "permissions" jsonb NOT NULL DEFAULT '[]',
  "priority" integer NULL DEFAULT 100,
  "parent_role" character varying(50) NULL,
  "is_active" boolean NULL DEFAULT true,
  "is_system_role" boolean NULL DEFAULT false,
  "created_at" timestamptz NULL DEFAULT now(),
  "updated_at" timestamptz NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "roles_name_key" UNIQUE ("name")
);
-- Create "scheduled_tasks" table
CREATE TABLE "scheduled_tasks" (
  "id" serial NOT NULL,
  "task_type" character varying(50) NOT NULL,
  "scheduled_for" timestamptz NOT NULL,
  "task_config" jsonb NOT NULL,
  "priority" integer NULL DEFAULT 5,
  "status" character varying(20) NULL DEFAULT 'pending',
  "started_at" timestamptz NULL,
  "completed_at" timestamptz NULL,
  "result_data" jsonb NULL,
  "error_message" text NULL,
  "retry_count" integer NULL DEFAULT 0,
  "max_retries" integer NULL DEFAULT 3,
  "is_recurring" boolean NULL DEFAULT false,
  "recurrence_pattern" character varying(100) NULL,
  "next_run_at" timestamptz NULL,
  "created_at" timestamptz NULL DEFAULT now(),
  "updated_at" timestamptz NULL DEFAULT now(),
  PRIMARY KEY ("id")
);
-- Create index "idx_scheduled_tasks_next_run" to table: "scheduled_tasks"
CREATE INDEX "idx_scheduled_tasks_next_run" ON "scheduled_tasks" ("next_run_at");
-- Create index "idx_scheduled_tasks_schedule" to table: "scheduled_tasks"
CREATE INDEX "idx_scheduled_tasks_schedule" ON "scheduled_tasks" ("scheduled_for");
-- Create index "idx_scheduled_tasks_status" to table: "scheduled_tasks"
CREATE INDEX "idx_scheduled_tasks_status" ON "scheduled_tasks" ("status");
-- Create index "idx_scheduled_tasks_type" to table: "scheduled_tasks"
CREATE INDEX "idx_scheduled_tasks_type" ON "scheduled_tasks" ("task_type");
-- Create "sessions" table
CREATE TABLE "sessions" (
  "id" serial NOT NULL,
  "session_token" character varying(255) NOT NULL,
  "user_id" integer NOT NULL,
  "ip_address" inet NULL,
  "user_agent" text NULL,
  "device_info" jsonb NULL,
  "country" character varying(2) NULL,
  "region" character varying(100) NULL,
  "city" character varying(100) NULL,
  "expires_at" timestamptz NOT NULL,
  "idle_timeout_at" timestamptz NULL,
  "absolute_timeout_at" timestamptz NULL,
  "is_active" boolean NULL DEFAULT true,
  "revoked_at" timestamptz NULL,
  "revoked_reason" character varying(100) NULL,
  "last_activity" timestamptz NULL DEFAULT now(),
  "request_count" integer NULL DEFAULT 0,
  "created_at" timestamptz NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "sessions_session_token_key" UNIQUE ("session_token")
);
-- Create index "idx_sessions_expiry" to table: "sessions"
CREATE INDEX "idx_sessions_expiry" ON "sessions" ("expires_at");
-- Create index "idx_sessions_token" to table: "sessions"
CREATE INDEX "idx_sessions_token" ON "sessions" ("session_token");
-- Create index "idx_sessions_user" to table: "sessions"
CREATE INDEX "idx_sessions_user" ON "sessions" ("user_id", "is_active");
-- Create "signals" table
CREATE TABLE "signals" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "strategy_id" integer NOT NULL,
  "symbol_id" integer NOT NULL,
  "ticker_symbol" character varying(10) NOT NULL,
  "source" character varying(50) NULL DEFAULT 'strategy',
  "signal_type" character varying(10) NOT NULL,
  "quantity" numeric(15,6) NOT NULL,
  "urgency" character varying(20) NULL DEFAULT 'normal',
  "confidence_score" numeric(3,2) NULL,
  "order_type" character varying(20) NULL DEFAULT 'MARKET',
  "limit_price" numeric(15,2) NULL,
  "stop_price" numeric(15,2) NULL,
  "time_in_force" character varying(10) NULL DEFAULT 'DAY',
  "stop_loss" numeric(15,2) NULL,
  "take_profit" numeric(15,2) NULL,
  "trail_percent" numeric(5,2) NULL,
  "trail_amount" numeric(15,2) NULL,
  "max_slippage" numeric(5,4) NULL,
  "extended_hours" boolean NULL DEFAULT false,
  "market_session" character varying(20) NULL,
  "processing_status" character varying(20) NULL DEFAULT 'created',
  "processing_started_at" timestamp NULL,
  "processing_completed_at" timestamp NULL,
  "processed_by" character varying(100) NULL,
  "failure_reason" text NULL,
  "strategy_config" jsonb NULL,
  "execution_config" jsonb NULL,
  "risk_config" jsonb NULL,
  "metadata" jsonb NULL,
  "created_at" timestamp NULL DEFAULT now(),
  "updated_at" timestamp NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "chk_signal_status" CHECK ((processing_status)::text = ANY ((ARRAY['created'::character varying, 'pending'::character varying, 'validating'::character varying, 'submitting'::character varying, 'submitted'::character varying, 'partially_filled'::character varying, 'filled'::character varying, 'cancelled'::character varying, 'rejected'::character varying, 'failed'::character varying])::text[])),
  CONSTRAINT "signals_confidence_score_check" CHECK ((confidence_score >= (0)::numeric) AND (confidence_score <= (1)::numeric)),
  CONSTRAINT "signals_quantity_check" CHECK (quantity > (0)::numeric),
  CONSTRAINT "signals_signal_type_check" CHECK ((signal_type)::text = ANY ((ARRAY['BUY'::character varying, 'SELL'::character varying, 'CLOSE'::character varying])::text[]))
);
-- Create index "idx_signals_created" to table: "signals"
CREATE INDEX "idx_signals_created" ON "signals" ("created_at");
-- Create index "idx_signals_created_status" to table: "signals"
CREATE INDEX "idx_signals_created_status" ON "signals" ("created_at" DESC, "processing_status");
-- Create index "idx_signals_source" to table: "signals"
CREATE INDEX "idx_signals_source" ON "signals" ("source");
-- Create index "idx_signals_status" to table: "signals"
CREATE INDEX "idx_signals_status" ON "signals" ("processing_status");
-- Create index "idx_signals_strategy" to table: "signals"
CREATE INDEX "idx_signals_strategy" ON "signals" ("strategy_id");
-- Create index "idx_signals_strategy_status" to table: "signals"
CREATE INDEX "idx_signals_strategy_status" ON "signals" ("strategy_id", "processing_status");
-- Create index "idx_signals_symbol" to table: "signals"
CREATE INDEX "idx_signals_symbol" ON "signals" ("symbol_id");
-- Create index "idx_signals_symbol_status" to table: "signals"
CREATE INDEX "idx_signals_symbol_status" ON "signals" ("symbol_id", "processing_status");
-- Create index "idx_signals_ticker" to table: "signals"
CREATE INDEX "idx_signals_ticker" ON "signals" ("ticker_symbol");
-- Create index "idx_signals_type" to table: "signals"
CREATE INDEX "idx_signals_type" ON "signals" ("signal_type");
-- Create index "idx_signals_updated" to table: "signals"
CREATE INDEX "idx_signals_updated" ON "signals" ("updated_at");
-- Create index "idx_signals_urgency" to table: "signals"
CREATE INDEX "idx_signals_urgency" ON "signals" ("urgency");
-- Create "strategies" table
CREATE TABLE "strategies" (
  "id" serial NOT NULL,
  "name" text NOT NULL,
  "processed_by_rust" boolean NOT NULL DEFAULT true,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NULL DEFAULT now(),
  "updated_at" timestamptz NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "strategies_name_key" UNIQUE ("name")
);
-- Create "strategy_allocations" table
CREATE TABLE "strategy_allocations" (
  "id" serial NOT NULL,
  "strategy_id" integer NOT NULL,
  "symbol_id" integer NOT NULL,
  "allocated_capital" numeric(15,2) NOT NULL,
  "used_capital" numeric(15,2) NULL DEFAULT 0,
  "available_capital" numeric(15,2) NULL GENERATED ALWAYS AS (allocated_capital - used_capital) STORED,
  "reserved_capital" numeric(15,2) NULL DEFAULT 0,
  "current_position" numeric(15,8) NULL DEFAULT 0,
  "average_cost" numeric(15,2) NULL DEFAULT 0,
  "realized_pnl" numeric(15,2) NULL DEFAULT 0,
  "unrealized_pnl" numeric(15,2) NULL DEFAULT 0,
  "total_trades" integer NULL DEFAULT 0,
  "winning_trades" integer NULL DEFAULT 0,
  "allocation_percentage" numeric(5,2) NULL,
  "is_active" boolean NULL DEFAULT true,
  "last_trade_time" timestamptz NULL,
  "created_at" timestamptz NULL DEFAULT now(),
  "updated_at" timestamptz NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "unique_strategy_symbol_allocation" UNIQUE ("strategy_id", "symbol_id"),
  CONSTRAINT "strategy_allocations_allocated_capital_check" CHECK (allocated_capital >= (0)::numeric),
  CONSTRAINT "strategy_allocations_allocation_percentage_check" CHECK ((allocation_percentage >= (0)::numeric) AND (allocation_percentage <= (100)::numeric)),
  CONSTRAINT "strategy_allocations_reserved_capital_check" CHECK (reserved_capital >= (0)::numeric),
  CONSTRAINT "strategy_allocations_used_capital_check" CHECK (used_capital >= (0)::numeric)
);
-- Create index "idx_strategy_allocations_active" to table: "strategy_allocations"
CREATE INDEX "idx_strategy_allocations_active" ON "strategy_allocations" ("strategy_id", "is_active") WHERE (is_active = true);
-- Create index "idx_strategy_allocations_capital" to table: "strategy_allocations"
CREATE INDEX "idx_strategy_allocations_capital" ON "strategy_allocations" ("strategy_id", "available_capital") WHERE (available_capital > (0)::numeric);
-- Create index "idx_strategy_allocations_strategy" to table: "strategy_allocations"
CREATE INDEX "idx_strategy_allocations_strategy" ON "strategy_allocations" ("strategy_id");
-- Create index "idx_strategy_allocations_symbol" to table: "strategy_allocations"
CREATE INDEX "idx_strategy_allocations_symbol" ON "strategy_allocations" ("symbol_id");
-- Set comment to table: "strategy_allocations"
COMMENT ON TABLE "strategy_allocations" IS 'Replaces ticker_allocations JSONB field with proper relational table for per-ticker capital management within strategies';
-- Create "update_updated_at_column" function
CREATE FUNCTION "update_updated_at_column" () RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;
-- Create trigger "update_strategy_allocations_updated_at"
CREATE TRIGGER "update_strategy_allocations_updated_at" BEFORE UPDATE ON "strategy_allocations" FOR EACH ROW EXECUTE FUNCTION "update_updated_at_column"();
-- Create "strategy_capital_snapshots" table
CREATE TABLE "strategy_capital_snapshots" (
  "id" serial NOT NULL,
  "strategy_id" integer NOT NULL,
  "snapshot_version" bigint NOT NULL,
  "allocated_capital" numeric(15,2) NOT NULL,
  "used_capital" numeric(15,2) NULL DEFAULT 0,
  "available_capital" numeric(15,2) NOT NULL,
  "reserved_capital" numeric(15,2) NULL DEFAULT 0,
  "ticker_allocations" jsonb NOT NULL,
  "realized_pnl" numeric(15,2) NULL DEFAULT 0,
  "unrealized_pnl" numeric(15,2) NULL DEFAULT 0,
  "snapshot_reason" character varying(100) NULL,
  "transaction_id" character varying(100) NULL,
  "created_at" timestamptz NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "strategy_capital_snapshots_strategy_id_snapshot_version_key" UNIQUE ("strategy_id", "snapshot_version")
);
-- Create index "idx_snapshots_reason" to table: "strategy_capital_snapshots"
CREATE INDEX "idx_snapshots_reason" ON "strategy_capital_snapshots" ("snapshot_reason");
-- Create index "idx_snapshots_strategy_time" to table: "strategy_capital_snapshots"
CREATE INDEX "idx_snapshots_strategy_time" ON "strategy_capital_snapshots" ("strategy_id", "created_at");
-- Create "strategy_config_parameters" table
CREATE TABLE "strategy_config_parameters" (
  "id" serial NOT NULL,
  "strategy_id" integer NOT NULL,
  "parameters" jsonb NOT NULL,
  "version" character varying(10) NULL DEFAULT '1.0',
  "is_active" boolean NULL DEFAULT true,
  "created_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  CONSTRAINT "strategy_config_parameters_strategy_id_key" UNIQUE ("strategy_id")
);
-- Create index "idx_strategy_config_parameters_parameters" to table: "strategy_config_parameters"
CREATE INDEX "idx_strategy_config_parameters_parameters" ON "strategy_config_parameters" USING gin ("parameters");
-- Create index "idx_strategy_config_parameters_strategy_id" to table: "strategy_config_parameters"
CREATE INDEX "idx_strategy_config_parameters_strategy_id" ON "strategy_config_parameters" ("strategy_id");
-- Create trigger "trigger_strategy_config_parameters_updated_at"
CREATE TRIGGER "trigger_strategy_config_parameters_updated_at" BEFORE UPDATE ON "strategy_config_parameters" FOR EACH ROW EXECUTE FUNCTION "update_updated_at_column"();
-- Create "strategy_market_hours" table
CREATE TABLE "strategy_market_hours" (
  "id" serial NOT NULL,
  "strategy_id" integer NOT NULL,
  "session_id" integer NOT NULL,
  "is_enabled" boolean NULL DEFAULT false,
  "position_size_multiplier" numeric(3,2) NULL DEFAULT 1.0,
  "risk_multiplier" numeric(3,2) NULL DEFAULT 1.0,
  "persist_state_across_sessions" boolean NULL DEFAULT true,
  "reset_on_session_start" boolean NULL DEFAULT false,
  "minimum_bars_required" integer NULL DEFAULT 20,
  "created_at" timestamptz NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "strategy_market_hours_strategy_id_session_id_key" UNIQUE ("strategy_id", "session_id")
);
-- Create index "idx_strategy_sessions_strategy" to table: "strategy_market_hours"
CREATE INDEX "idx_strategy_sessions_strategy" ON "strategy_market_hours" ("strategy_id");
-- Create "strategy_parameters" table
CREATE TABLE "strategy_parameters" (
  "id" serial NOT NULL,
  "strategy_id" integer NOT NULL,
  "parameter_set_name" character varying(100) NOT NULL,
  "parameters" jsonb NOT NULL,
  "regime_id" integer NULL,
  "is_active" boolean NULL DEFAULT true,
  "created_at" timestamptz NULL DEFAULT now(),
  "updated_at" timestamptz NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "strategy_parameters_strategy_id_parameter_set_name_key" UNIQUE ("strategy_id", "parameter_set_name")
);
-- Create index "idx_params_regime" to table: "strategy_parameters"
CREATE INDEX "idx_params_regime" ON "strategy_parameters" ("strategy_id", "regime_id");
-- Create "strategy_ticker_regimes" table
CREATE TABLE "strategy_ticker_regimes" (
  "id" serial NOT NULL,
  "strategy_id" integer NOT NULL,
  "symbol_id" integer NOT NULL,
  "symbol" character varying(10) NOT NULL,
  "regime_id" integer NOT NULL,
  "regime_parameters" jsonb NOT NULL,
  "is_active" boolean NULL DEFAULT true,
  "created_at" timestamptz NULL DEFAULT now(),
  "updated_at" timestamptz NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "strategy_ticker_regimes_strategy_id_symbol_id_regime_id_key" UNIQUE ("strategy_id", "symbol_id", "regime_id")
);
-- Create index "idx_ticker_regimes_strategy" to table: "strategy_ticker_regimes"
CREATE INDEX "idx_ticker_regimes_strategy" ON "strategy_ticker_regimes" ("strategy_id", "regime_id");
-- Create index "idx_ticker_regimes_symbol" to table: "strategy_ticker_regimes"
CREATE INDEX "idx_ticker_regimes_symbol" ON "strategy_ticker_regimes" ("symbol_id");
-- Create "strategy_validations" table
CREATE TABLE "strategy_validations" (
  "id" serial NOT NULL,
  "strategy_id" integer NOT NULL,
  "validation_type" character varying(50) NOT NULL,
  "validation_rule" jsonb NOT NULL,
  "is_valid" boolean NOT NULL,
  "validation_message" text NULL,
  "validated_at" timestamptz NULL DEFAULT now(),
  "validated_by" character varying(100) NULL,
  PRIMARY KEY ("id")
);
-- Create index "idx_strategy_validations_strategy" to table: "strategy_validations"
CREATE INDEX "idx_strategy_validations_strategy" ON "strategy_validations" ("strategy_id");
-- Create index "idx_strategy_validations_type" to table: "strategy_validations"
CREATE INDEX "idx_strategy_validations_type" ON "strategy_validations" ("validation_type");
-- Create "symbol_events" table
CREATE TABLE "symbol_events" (
  "id" serial NOT NULL,
  "symbol_id" integer NOT NULL,
  "event_type" character varying(50) NOT NULL,
  "event_date" date NOT NULL,
  "description" text NULL,
  "impact_level" character varying(20) NULL,
  "event_data" jsonb NULL,
  "is_processed" boolean NULL DEFAULT false,
  "processed_at" timestamptz NULL,
  "created_at" timestamptz NULL DEFAULT now(),
  PRIMARY KEY ("id")
);
-- Create index "idx_symbol_events" to table: "symbol_events"
CREATE INDEX "idx_symbol_events" ON "symbol_events" ("symbol_id", "event_date");
-- Create index "idx_symbol_events_type" to table: "symbol_events"
CREATE INDEX "idx_symbol_events_type" ON "symbol_events" ("event_type", "event_date");
-- Create "symbol_fundamentals" table
CREATE TABLE "symbol_fundamentals" (
  "id" serial NOT NULL,
  "symbol_id" integer NOT NULL,
  "report_date" date NOT NULL,
  "fiscal_period" character varying(10) NULL,
  "pe_ratio" numeric(10,2) NULL,
  "forward_pe" numeric(10,2) NULL,
  "peg_ratio" numeric(10,2) NULL,
  "price_to_book" numeric(10,2) NULL,
  "price_to_sales" numeric(10,2) NULL,
  "ev_to_ebitda" numeric(10,2) NULL,
  "revenue" numeric(20,2) NULL,
  "gross_profit" numeric(20,2) NULL,
  "operating_income" numeric(20,2) NULL,
  "net_income" numeric(20,2) NULL,
  "eps" numeric(10,4) NULL,
  "diluted_eps" numeric(10,4) NULL,
  "total_assets" numeric(20,2) NULL,
  "total_liabilities" numeric(20,2) NULL,
  "total_equity" numeric(20,2) NULL,
  "cash_and_equivalents" numeric(20,2) NULL,
  "total_debt" numeric(20,2) NULL,
  "operating_cash_flow" numeric(20,2) NULL,
  "free_cash_flow" numeric(20,2) NULL,
  "gross_margin" numeric(5,2) NULL,
  "operating_margin" numeric(5,2) NULL,
  "profit_margin" numeric(5,2) NULL,
  "revenue_growth_yoy" numeric(7,4) NULL,
  "earnings_growth_yoy" numeric(7,4) NULL,
  "roe" numeric(7,4) NULL,
  "roa" numeric(7,4) NULL,
  "roic" numeric(7,4) NULL,
  "created_at" timestamptz NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "symbol_fundamentals_symbol_id_report_date_fiscal_period_key" UNIQUE ("symbol_id", "report_date", "fiscal_period")
);
-- Create "symbols" table
CREATE TABLE "symbols" (
  "id" serial NOT NULL,
  "symbol" text NOT NULL,
  "name" text NOT NULL,
  "exchange" text NULL,
  "marginable" boolean NULL DEFAULT false,
  "shortable" boolean NULL DEFAULT false,
  "fractionable" boolean NULL DEFAULT false,
  "created_at" timestamptz NULL DEFAULT now(),
  "updated_at" timestamptz NULL DEFAULT now(),
  "type" character varying(20) NOT NULL DEFAULT 'stock',
  "active" boolean NULL DEFAULT true,
  "tradable" boolean NULL DEFAULT true,
  "primary_exchange" character varying(10) NOT NULL DEFAULT 'NYSE',
  "market" character varying(20) NOT NULL DEFAULT 'stocks',
  "currency_name" character varying(10) NULL DEFAULT 'USD',
  "cik" character varying(10) NULL,
  "composite_figi" character varying(12) NULL,
  "share_class_figi" character varying(12) NULL,
  "lei" character varying(20) NULL,
  "sic_code" character varying(4) NULL,
  "sic_description" text NULL,
  "market_cap_category" character varying(20) NULL,
  "sector" character varying(100) NULL,
  "industry" character varying(100) NULL,
  "sub_industry" character varying(100) NULL,
  "market_cap" numeric(20,2) NULL,
  "shares_outstanding" bigint NULL,
  "weighted_shares_outstanding" bigint NULL,
  "float_shares" bigint NULL,
  "round_lot_size" integer NULL DEFAULT 100,
  "min_tick_size" numeric(10,6) NULL DEFAULT 0.01,
  "pre_market_enabled" boolean NULL DEFAULT false,
  "after_hours_enabled" boolean NULL DEFAULT false,
  "otc_enabled" boolean NULL DEFAULT false,
  "options_enabled" boolean NULL DEFAULT false,
  "weekly_options" boolean NULL DEFAULT false,
  "last_dividend_date" date NULL,
  "dividend_frequency" character varying(20) NULL,
  "ex_dividend_date" date NULL,
  "split_date" date NULL,
  "split_ratio" character varying(20) NULL,
  "alpaca_asset_id" uuid NULL,
  "alpaca_asset_class" character varying(20) NULL,
  "easy_to_borrow" boolean NULL,
  "maintenance_margin_requirement" numeric(5,2) NULL,
  "polygon_ticker_root" character varying(10) NULL,
  "polygon_locale" character varying(10) NULL DEFAULT 'us',
  "composite_ticker" character varying(20) NULL,
  "share_class_ticker" character varying(20) NULL,
  "last_price" numeric(15,2) NULL,
  "last_price_timestamp" timestamp NULL,
  "previous_close" numeric(15,2) NULL,
  "day_change" numeric(15,2) NULL,
  "day_change_percent" numeric(7,4) NULL,
  "avg_volume_10d" bigint NULL,
  "avg_volume_30d" bigint NULL,
  "avg_volume_90d" bigint NULL,
  "relative_volume" numeric(5,2) NULL,
  "beta" numeric(5,2) NULL,
  "correlation_spy" numeric(3,2) NULL,
  "volatility_20d" numeric(5,4) NULL,
  "volatility_60d" numeric(5,4) NULL,
  "atr_14" numeric(15,2) NULL,
  "risk_score" numeric(5,2) NULL,
  "liquidity_score" numeric(5,2) NULL,
  "news_sentiment_score" numeric(3,2) NULL,
  "news_mention_count" integer NULL,
  "social_sentiment_score" numeric(3,2) NULL,
  "trading_halted" boolean NULL DEFAULT false,
  "halt_reason" character varying(100) NULL,
  "halt_timestamp" timestamp NULL,
  "delisted" boolean NULL DEFAULT false,
  "delisted_date" date NULL,
  "is_watched" boolean NULL DEFAULT false,
  "is_restricted" boolean NULL DEFAULT false,
  "restriction_reason" text NULL,
  "max_position_size" numeric(15,2) NULL,
  "data_source" character varying(50) NULL DEFAULT 'polygon',
  "last_sync_timestamp" timestamp NULL,
  "sync_status" character varying(20) NULL DEFAULT 'pending',
  "data_quality_score" numeric(3,2) NULL,
  "notes" text NULL,
  "tags" text[] NULL,
  "custom_data" jsonb NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "symbols_symbol_key" UNIQUE ("symbol"),
  CONSTRAINT "chk_symbol_type" CHECK ((type)::text = ANY ((ARRAY['stock'::character varying, 'etf'::character varying, 'adr'::character varying, 'reit'::character varying, 'trust'::character varying, 'warrant'::character varying, 'right'::character varying, 'unit'::character varying])::text[]))
);
-- Create index "idx_symbols_active" to table: "symbols"
CREATE INDEX "idx_symbols_active" ON "symbols" ("active");
-- Create index "idx_symbols_exchange" to table: "symbols"
CREATE INDEX "idx_symbols_exchange" ON "symbols" ("primary_exchange");
-- Create index "idx_symbols_market" to table: "symbols"
CREATE INDEX "idx_symbols_market" ON "symbols" ("market");
-- Create index "idx_symbols_market_cap" to table: "symbols"
CREATE INDEX "idx_symbols_market_cap" ON "symbols" ("market_cap_category");
-- Create index "idx_symbols_restricted" to table: "symbols"
CREATE INDEX "idx_symbols_restricted" ON "symbols" ("is_restricted");
-- Create index "idx_symbols_sector" to table: "symbols"
CREATE INDEX "idx_symbols_sector" ON "symbols" ("sector");
-- Create index "idx_symbols_symbol" to table: "symbols"
CREATE INDEX "idx_symbols_symbol" ON "symbols" ("symbol");
-- Create index "idx_symbols_tradable" to table: "symbols"
CREATE INDEX "idx_symbols_tradable" ON "symbols" ("tradable");
-- Create index "idx_symbols_type" to table: "symbols"
CREATE INDEX "idx_symbols_type" ON "symbols" ("type");
-- Create index "idx_symbols_updated" to table: "symbols"
CREATE INDEX "idx_symbols_updated" ON "symbols" ("updated_at");
-- Create index "idx_symbols_watched" to table: "symbols"
CREATE INDEX "idx_symbols_watched" ON "symbols" ("is_watched");
-- Create "set_timestamp_updated_at" function
CREATE FUNCTION "set_timestamp_updated_at" () RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;
-- Create trigger "set_symbols_updated_at"
CREATE TRIGGER "set_symbols_updated_at" BEFORE UPDATE ON "symbols" FOR EACH ROW EXECUTE FUNCTION "set_timestamp_updated_at"();
-- Create "system_config" table
CREATE TABLE "system_config" (
  "id" serial NOT NULL,
  "key" character varying(100) NOT NULL,
  "value" text NULL,
  "data_type" character varying(20) NULL DEFAULT 'string',
  "description" text NULL,
  "category" character varying(50) NULL,
  "validation_rules" jsonb NULL,
  "is_sensitive" boolean NULL DEFAULT false,
  "is_active" boolean NULL DEFAULT true,
  "requires_restart" boolean NULL DEFAULT false,
  "updated_by" character varying(100) NULL,
  "updated_at" timestamptz NULL DEFAULT now(),
  "created_at" timestamptz NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "system_config_key_key" UNIQUE ("key")
);
-- Create index "idx_system_config_active" to table: "system_config"
CREATE INDEX "idx_system_config_active" ON "system_config" ("is_active");
-- Create index "idx_system_config_category" to table: "system_config"
CREATE INDEX "idx_system_config_category" ON "system_config" ("category");
-- Create index "idx_system_config_key" to table: "system_config"
CREATE INDEX "idx_system_config_key" ON "system_config" ("key");
-- Create "system_health" table
CREATE TABLE "system_health" (
  "id" serial NOT NULL,
  "component" character varying(50) NOT NULL,
  "status" character varying(20) NOT NULL,
  "response_time_ms" integer NULL,
  "error_rate" numeric(5,2) NULL,
  "throughput_per_second" numeric(10,2) NULL,
  "last_error" text NULL,
  "error_count" integer NULL DEFAULT 0,
  "uptime_percentage" numeric(5,2) NULL,
  "metrics" jsonb NULL,
  "timestamp" timestamptz NULL DEFAULT now(),
  PRIMARY KEY ("id")
);
-- Create index "idx_system_health_component" to table: "system_health"
CREATE INDEX "idx_system_health_component" ON "system_health" ("component");
-- Create index "idx_system_health_status" to table: "system_health"
CREATE INDEX "idx_system_health_status" ON "system_health" ("status");
-- Create index "idx_system_health_time" to table: "system_health"
CREATE INDEX "idx_system_health_time" ON "system_health" ("timestamp");
-- Create "trading_pauses" table
CREATE TABLE "trading_pauses" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "pause_type" character varying(50) NOT NULL,
  "scope" character varying(20) NULL,
  "strategy_id" integer NULL,
  "symbol_id" integer NULL,
  "initiated_by" integer NULL,
  "reason" text NOT NULL,
  "duration_minutes" integer NULL,
  "is_active" boolean NULL DEFAULT true,
  "started_at" timestamptz NULL DEFAULT now(),
  "ends_at" timestamptz NULL,
  "ended_at" timestamptz NULL,
  "ended_by" integer NULL,
  "pause_data" jsonb NULL,
  PRIMARY KEY ("id")
);
-- Create index "idx_trading_pauses_active" to table: "trading_pauses"
CREATE INDEX "idx_trading_pauses_active" ON "trading_pauses" ("is_active");
-- Create index "idx_trading_pauses_strategy" to table: "trading_pauses"
CREATE INDEX "idx_trading_pauses_strategy" ON "trading_pauses" ("strategy_id");
-- Create index "idx_trading_pauses_symbol" to table: "trading_pauses"
CREATE INDEX "idx_trading_pauses_symbol" ON "trading_pauses" ("symbol_id");
-- Create index "idx_trading_pauses_type" to table: "trading_pauses"
CREATE INDEX "idx_trading_pauses_type" ON "trading_pauses" ("pause_type");
-- Create "two_factor_auth" table
CREATE TABLE "two_factor_auth" (
  "id" serial NOT NULL,
  "user_id" integer NOT NULL,
  "secret" character varying(255) NOT NULL,
  "backup_codes" text[] NULL,
  "is_enabled" boolean NULL DEFAULT false,
  "enabled_at" timestamptz NULL,
  "recovery_email" character varying(255) NULL,
  "recovery_phone" character varying(20) NULL,
  "last_used" timestamptz NULL,
  "failed_attempts" integer NULL DEFAULT 0,
  "created_at" timestamptz NULL DEFAULT now(),
  "updated_at" timestamptz NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "two_factor_auth_user_id_key" UNIQUE ("user_id")
);
-- Create "user_permissions" table
CREATE TABLE "user_permissions" (
  "id" serial NOT NULL,
  "user_id" integer NOT NULL,
  "permission_id" integer NOT NULL,
  "is_granted" boolean NULL DEFAULT true,
  "conditions" jsonb NULL,
  "expires_at" timestamptz NULL,
  "granted_by" character varying(100) NULL,
  "granted_at" timestamptz NULL DEFAULT now(),
  "reason" text NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "user_permissions_user_id_permission_id_key" UNIQUE ("user_id", "permission_id")
);
-- Create index "idx_user_permissions_user" to table: "user_permissions"
CREATE INDEX "idx_user_permissions_user" ON "user_permissions" ("user_id");
-- Create "users" table
CREATE TABLE "users" (
  "id" serial NOT NULL,
  "clerk_user_id" character varying(255) NULL,
  "email" character varying(255) NOT NULL,
  "email_verified" boolean NULL DEFAULT false,
  "name" character varying(100) NOT NULL,
  "avatar_url" text NULL,
  "phone" character varying(20) NULL,
  "timezone" character varying(50) NULL DEFAULT 'America/New_York',
  "locale" character varying(10) NULL DEFAULT 'en-US',
  "role" character varying(50) NOT NULL DEFAULT 'viewer',
  "department" character varying(50) NULL,
  "permissions" jsonb NULL DEFAULT '[]',
  "can_trade" boolean NULL DEFAULT false,
  "can_approve_strategies" boolean NULL DEFAULT false,
  "can_override_risk" boolean NULL DEFAULT false,
  "max_order_value" numeric(15,2) NULL,
  "is_active" boolean NULL DEFAULT true,
  "is_verified" boolean NULL DEFAULT false,
  "is_two_factor_enabled" boolean NULL DEFAULT false,
  "last_login" timestamptz NULL,
  "login_count" integer NULL DEFAULT 0,
  "failed_login_attempts" integer NULL DEFAULT 0,
  "locked_until" timestamptz NULL,
  "password_changed_at" timestamptz NULL,
  "preferences" jsonb NULL DEFAULT '{}',
  "notification_settings" jsonb NULL DEFAULT '{}',
  "created_at" timestamptz NULL DEFAULT now(),
  "updated_at" timestamptz NULL DEFAULT now(),
  "created_by" character varying(100) NULL,
  "terms_accepted_at" timestamptz NULL,
  "privacy_accepted_at" timestamptz NULL,
  "last_activity" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "users_clerk_user_id_key" UNIQUE ("clerk_user_id"),
  CONSTRAINT "users_email_key" UNIQUE ("email")
);
-- Create index "idx_users_active" to table: "users"
CREATE INDEX "idx_users_active" ON "users" ("is_active");
-- Create index "idx_users_clerk_id" to table: "users"
CREATE INDEX "idx_users_clerk_id" ON "users" ("clerk_user_id");
-- Create index "idx_users_email" to table: "users"
CREATE INDEX "idx_users_email" ON "users" ("email");
-- Create index "idx_users_role" to table: "users"
CREATE INDEX "idx_users_role" ON "users" ("role");
-- Create "verification_tokens" table
CREATE TABLE "verification_tokens" (
  "id" serial NOT NULL,
  "identifier" character varying(255) NOT NULL,
  "token" character varying(255) NOT NULL,
  "token_type" character varying(50) NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "used_at" timestamptz NULL,
  "created_at" timestamptz NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "verification_tokens_token_key" UNIQUE ("token")
);
-- Create index "idx_verification_expiry" to table: "verification_tokens"
CREATE INDEX "idx_verification_expiry" ON "verification_tokens" ("expires_at");
-- Create index "idx_verification_token" to table: "verification_tokens"
CREATE INDEX "idx_verification_token" ON "verification_tokens" ("token");
-- Create index "idx_verification_unique" to table: "verification_tokens"
CREATE UNIQUE INDEX "idx_verification_unique" ON "verification_tokens" ("identifier", "token", "token_type");
-- Create "walk_forward_results" table
CREATE TABLE "walk_forward_results" (
  "id" serial NOT NULL,
  "strategy_id" integer NOT NULL,
  "window_size_days" integer NOT NULL,
  "step_size_days" integer NOT NULL,
  "optimization_period_days" integer NOT NULL,
  "period_start" date NOT NULL,
  "period_end" date NOT NULL,
  "is_optimization_period" boolean NOT NULL,
  "parameters" jsonb NOT NULL,
  "total_return" numeric(7,4) NULL,
  "sharpe_ratio" numeric(5,2) NULL,
  "max_drawdown" numeric(7,4) NULL,
  "total_trades" integer NULL,
  "win_rate" numeric(5,2) NULL,
  "created_at" timestamptz NULL DEFAULT now(),
  PRIMARY KEY ("id")
);
-- Create index "idx_walk_forward_period" to table: "walk_forward_results"
CREATE INDEX "idx_walk_forward_period" ON "walk_forward_results" ("period_start", "period_end");
-- Create index "idx_walk_forward_strategy" to table: "walk_forward_results"
CREATE INDEX "idx_walk_forward_strategy" ON "walk_forward_results" ("strategy_id");
-- Create "get_available_capital" function
CREATE FUNCTION "get_available_capital" ("p_strategy_id" integer, "p_symbol_id" integer) RETURNS numeric LANGUAGE plpgsql AS $$
DECLARE
    v_available DECIMAL;
BEGIN
    SELECT available_capital INTO v_available
    FROM strategy_allocations
    WHERE strategy_id = p_strategy_id 
    AND symbol_id = p_symbol_id
    AND is_active = true;
    
    RETURN COALESCE(v_available, 0);
END;
$$;
-- Create "notify_channel" function
CREATE FUNCTION "notify_channel" ("channel" text, "payload" text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM pg_notify(channel, payload);
END;
$$;
-- Create "notify_config_change" function
CREATE FUNCTION "notify_config_change" () RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM pg_notify('configuration_changes', '');
  RETURN NEW;
END;
$$;
-- Create "notify_new_signal" function
CREATE FUNCTION "notify_new_signal" () RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM pg_notify('trading_signals', COALESCE(NEW.id::text, ''));
  RETURN NEW;
END;
$$;
-- Create "notify_news_event" function
CREATE FUNCTION "notify_news_event" () RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM pg_notify('news_events', COALESCE(NEW.id::text, ''));
  RETURN NEW;
END;
$$;
-- Create "notify_order_update" function
CREATE FUNCTION "notify_order_update" () RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM pg_notify('order_updates', COALESCE(NEW.id::text, ''));
  RETURN NEW;
END;
$$;
-- Create "notify_position_change" function
CREATE FUNCTION "notify_position_change" () RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM pg_notify('position_changes', COALESCE(NEW.id::text, ''));
  RETURN NEW;
END;
$$;
-- Create "refresh_trading_metrics" function
CREATE FUNCTION "refresh_trading_metrics" () RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY trading_metrics_realtime;
END;
$$;
-- Create "update_strategy_allocation_on_trade" function
CREATE FUNCTION "update_strategy_allocation_on_trade" ("p_strategy_id" integer, "p_symbol_id" integer, "p_trade_type" character varying, "p_quantity" numeric, "p_price" numeric, "p_commission" numeric DEFAULT 0) RETURNS boolean LANGUAGE plpgsql AS $$
DECLARE
    v_allocation RECORD;
    v_new_position DECIMAL;
    v_new_avg_cost DECIMAL;
    v_capital_change DECIMAL;
BEGIN
    -- Get current allocation
    SELECT * INTO v_allocation
    FROM strategy_allocations
    WHERE strategy_id = p_strategy_id AND symbol_id = p_symbol_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No allocation found for strategy_id % and symbol_id %', p_strategy_id, p_symbol_id;
    END IF;
    
    -- Calculate capital change (including commission)
    v_capital_change := (p_quantity * p_price) + p_commission;
    
    IF p_trade_type = 'BUY' THEN
        -- Update position and average cost
        v_new_position := v_allocation.current_position + p_quantity;
        IF v_new_position > 0 THEN
            v_new_avg_cost := ((v_allocation.current_position * v_allocation.average_cost) + v_capital_change) / v_new_position;
        ELSE
            v_new_avg_cost := 0;
        END IF;
        
        -- Update allocation
        UPDATE strategy_allocations
        SET 
            current_position = v_new_position,
            average_cost = v_new_avg_cost,
            used_capital = used_capital + v_capital_change,
            total_trades = total_trades + 1,
            last_trade_time = NOW(),
            updated_at = NOW()
        WHERE strategy_id = p_strategy_id AND symbol_id = p_symbol_id;
        
    ELSIF p_trade_type = 'SELL' THEN
        -- Calculate realized PnL
        v_new_position := v_allocation.current_position - p_quantity;
        
        -- Update allocation
        UPDATE strategy_allocations
        SET 
            current_position = v_new_position,
            used_capital = GREATEST(0, used_capital - v_capital_change),
            realized_pnl = realized_pnl + ((p_price - v_allocation.average_cost) * p_quantity - p_commission),
            total_trades = total_trades + 1,
            winning_trades = winning_trades + CASE 
                WHEN (p_price - v_allocation.average_cost) * p_quantity > p_commission THEN 1 
                ELSE 0 
            END,
            last_trade_time = NOW(),
            updated_at = NOW()
        WHERE strategy_id = p_strategy_id AND symbol_id = p_symbol_id;
        
        -- Reset average cost if position is closed
        IF v_new_position = 0 THEN
            UPDATE strategy_allocations
            SET average_cost = 0
            WHERE strategy_id = p_strategy_id AND symbol_id = p_symbol_id;
        END IF;
    END IF;
    
    RETURN TRUE;
END;
$$;
-- Modify "accounts" table
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;
-- Modify "api_keys" table
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;
-- Modify "audit_actions" table
ALTER TABLE "audit_actions" ADD CONSTRAINT "audit_actions_api_key_id_fkey" FOREIGN KEY ("api_key_id") REFERENCES "api_keys" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION, ADD CONSTRAINT "audit_actions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION, ADD CONSTRAINT "audit_actions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;
-- Modify "authorization_codes" table
ALTER TABLE "authorization_codes" ADD CONSTRAINT "authorization_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;
-- Modify "backtest_equity_curve" table
ALTER TABLE "backtest_equity_curve" ADD CONSTRAINT "backtest_equity_curve_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "backtest_runs" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;
-- Modify "backtest_metrics" table
ALTER TABLE "backtest_metrics" ADD CONSTRAINT "backtest_metrics_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "backtest_runs" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;
-- Modify "backtest_runs" table
ALTER TABLE "backtest_runs" ADD CONSTRAINT "backtest_runs_backtest_symbols_fkey" FOREIGN KEY ("backtest_symbols") REFERENCES "backtest_symbols" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION, ADD CONSTRAINT "backtest_runs_strategy_id_fkey" FOREIGN KEY ("strategy_id") REFERENCES "strategies" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;
-- Modify "backtest_symbols" table
ALTER TABLE "backtest_symbols" ADD CONSTRAINT "backtest_symbols_symbol_fkey" FOREIGN KEY ("symbol") REFERENCES "symbols" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION, ADD CONSTRAINT "fk_backtest_symbols_backtest_id" FOREIGN KEY ("backtest_id") REFERENCES "backtest_runs" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;
-- Modify "backtest_trades" table
ALTER TABLE "backtest_trades" ADD CONSTRAINT "backtest_trades_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "backtest_runs" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION, ADD CONSTRAINT "backtest_trades_symbol_fkey" FOREIGN KEY ("symbol") REFERENCES "symbols" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;
-- Modify "backtests" table
ALTER TABLE "backtests" ADD CONSTRAINT "backtests_strategy_id_fkey" FOREIGN KEY ("strategy_id") REFERENCES "strategies" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;
-- Modify "emergency_halts" table
ALTER TABLE "emergency_halts" ADD CONSTRAINT "emergency_halts_initiated_by_fkey" FOREIGN KEY ("initiated_by") REFERENCES "users" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION, ADD CONSTRAINT "emergency_halts_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;
-- Modify "executions" table
ALTER TABLE "executions" ADD CONSTRAINT "executions_symbol_id_fkey" FOREIGN KEY ("symbol_id") REFERENCES "symbols" ("id") ON UPDATE NO ACTION ON DELETE RESTRICT;
-- Modify "global_market_regime" table
ALTER TABLE "global_market_regime" ADD CONSTRAINT "global_market_regime_current_regime_id_fkey" FOREIGN KEY ("current_regime_id") REFERENCES "regime_types" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION, ADD CONSTRAINT "global_market_regime_previous_regime_id_fkey" FOREIGN KEY ("previous_regime_id") REFERENCES "regime_types" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;
-- Modify "login_history" table
ALTER TABLE "login_history" ADD CONSTRAINT "login_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;
-- Modify "market_data" table
ALTER TABLE "market_data" ADD CONSTRAINT "market_data_symbol_id_fkey" FOREIGN KEY ("symbol_id") REFERENCES "symbols" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;
-- Modify "monte_carlo_results" table
ALTER TABLE "monte_carlo_results" ADD CONSTRAINT "monte_carlo_results_strategy_id_fkey" FOREIGN KEY ("strategy_id") REFERENCES "strategies" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;
-- Modify "news_articles" table
ALTER TABLE "news_articles" ADD CONSTRAINT "news_articles_symbol_id_fkey" FOREIGN KEY ("symbol_id") REFERENCES "symbols" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;
-- Modify "orders" table
ALTER TABLE "orders" ADD CONSTRAINT "orders_signal_id_fkey" FOREIGN KEY ("signal_id") REFERENCES "signals" ("id") ON UPDATE NO ACTION ON DELETE SET NULL, ADD CONSTRAINT "orders_symbol_id_fkey" FOREIGN KEY ("symbol_id") REFERENCES "symbols" ("id") ON UPDATE NO ACTION ON DELETE RESTRICT;
-- Modify "positions" table
ALTER TABLE "positions" ADD CONSTRAINT "positions_strategy_id_fkey" FOREIGN KEY ("strategy_id") REFERENCES "strategies" ("id") ON UPDATE NO ACTION ON DELETE SET NULL, ADD CONSTRAINT "positions_symbol_id_fkey" FOREIGN KEY ("symbol_id") REFERENCES "symbols" ("id") ON UPDATE NO ACTION ON DELETE RESTRICT;
-- Modify "risk_alert_history" table
ALTER TABLE "risk_alert_history" ADD CONSTRAINT "risk_alert_history_risk_alert_id_fkey" FOREIGN KEY ("risk_alert_id") REFERENCES "risk_alerts" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;
-- Modify "risk_control_actions" table
ALTER TABLE "risk_control_actions" ADD CONSTRAINT "risk_control_actions_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION, ADD CONSTRAINT "risk_control_actions_initiated_by_fkey" FOREIGN KEY ("initiated_by") REFERENCES "users" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;
-- Modify "risk_events" table
ALTER TABLE "risk_events" ADD CONSTRAINT "risk_events_risk_limit_id_fkey" FOREIGN KEY ("risk_limit_id") REFERENCES "risk_limits" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;
-- Modify "sessions" table
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;
-- Modify "signals" table
ALTER TABLE "signals" ADD CONSTRAINT "signals_symbol_id_fkey" FOREIGN KEY ("symbol_id") REFERENCES "symbols" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;
-- Modify "strategy_allocations" table
ALTER TABLE "strategy_allocations" ADD CONSTRAINT "strategy_allocations_strategy_id_fkey" FOREIGN KEY ("strategy_id") REFERENCES "strategies" ("id") ON UPDATE NO ACTION ON DELETE CASCADE, ADD CONSTRAINT "strategy_allocations_symbol_id_fkey" FOREIGN KEY ("symbol_id") REFERENCES "symbols" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;
-- Modify "strategy_capital_snapshots" table
ALTER TABLE "strategy_capital_snapshots" ADD CONSTRAINT "strategy_capital_snapshots_strategy_id_fkey" FOREIGN KEY ("strategy_id") REFERENCES "strategies" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;
-- Modify "strategy_config_parameters" table
ALTER TABLE "strategy_config_parameters" ADD CONSTRAINT "fk_strategy_config_parameters_strategy" FOREIGN KEY ("strategy_id") REFERENCES "strategies" ("id") ON UPDATE NO ACTION ON DELETE CASCADE;
-- Modify "strategy_market_hours" table
ALTER TABLE "strategy_market_hours" ADD CONSTRAINT "strategy_market_hours_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "market_sessions" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION, ADD CONSTRAINT "strategy_market_hours_strategy_id_fkey" FOREIGN KEY ("strategy_id") REFERENCES "strategies" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;
-- Modify "strategy_parameters" table
ALTER TABLE "strategy_parameters" ADD CONSTRAINT "strategy_parameters_strategy_id_fkey" FOREIGN KEY ("strategy_id") REFERENCES "strategies" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;
-- Modify "strategy_ticker_regimes" table
ALTER TABLE "strategy_ticker_regimes" ADD CONSTRAINT "strategy_ticker_regimes_regime_id_fkey" FOREIGN KEY ("regime_id") REFERENCES "regime_types" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION, ADD CONSTRAINT "strategy_ticker_regimes_strategy_id_fkey" FOREIGN KEY ("strategy_id") REFERENCES "strategies" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION, ADD CONSTRAINT "strategy_ticker_regimes_symbol_id_fkey" FOREIGN KEY ("symbol_id") REFERENCES "symbols" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;
-- Modify "strategy_validations" table
ALTER TABLE "strategy_validations" ADD CONSTRAINT "strategy_validations_strategy_id_fkey" FOREIGN KEY ("strategy_id") REFERENCES "strategies" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;
-- Modify "symbol_events" table
ALTER TABLE "symbol_events" ADD CONSTRAINT "symbol_events_symbol_id_fkey" FOREIGN KEY ("symbol_id") REFERENCES "symbols" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;
-- Modify "symbol_fundamentals" table
ALTER TABLE "symbol_fundamentals" ADD CONSTRAINT "symbol_fundamentals_symbol_id_fkey" FOREIGN KEY ("symbol_id") REFERENCES "symbols" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;
-- Modify "trading_pauses" table
ALTER TABLE "trading_pauses" ADD CONSTRAINT "trading_pauses_ended_by_fkey" FOREIGN KEY ("ended_by") REFERENCES "users" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION, ADD CONSTRAINT "trading_pauses_initiated_by_fkey" FOREIGN KEY ("initiated_by") REFERENCES "users" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION, ADD CONSTRAINT "trading_pauses_strategy_id_fkey" FOREIGN KEY ("strategy_id") REFERENCES "strategies" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION, ADD CONSTRAINT "trading_pauses_symbol_id_fkey" FOREIGN KEY ("symbol_id") REFERENCES "symbols" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;
-- Modify "two_factor_auth" table
ALTER TABLE "two_factor_auth" ADD CONSTRAINT "two_factor_auth_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;
-- Modify "user_permissions" table
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION, ADD CONSTRAINT "user_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;
-- Modify "walk_forward_results" table
ALTER TABLE "walk_forward_results" ADD CONSTRAINT "walk_forward_results_strategy_id_fkey" FOREIGN KEY ("strategy_id") REFERENCES "strategies" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;
-- Create "database_metrics" view
CREATE VIEW "database_metrics" (
  "metric_name",
  "value",
  "timestamp"
) AS SELECT 'database_connections_active'::text AS metric_name,
    count(*)::numeric AS value,
    now() AS "timestamp"
   FROM pg_stat_activity
  WHERE pg_stat_activity.state = 'active'::text
UNION ALL
 SELECT 'database_connections_idle'::text AS metric_name,
    count(*)::numeric AS value,
    now() AS "timestamp"
   FROM pg_stat_activity
  WHERE pg_stat_activity.state = 'idle'::text
UNION ALL
 SELECT 'database_locks_granted'::text AS metric_name,
    count(*)::numeric AS value,
    now() AS "timestamp"
   FROM pg_locks
  WHERE pg_locks.granted = true
UNION ALL
 SELECT 'database_size_bytes'::text AS metric_name,
    pg_database_size(current_database())::numeric AS value,
    now() AS "timestamp"
UNION ALL
 SELECT 'database_transactions_committed'::text AS metric_name,
    pg_stat_database.xact_commit::numeric AS value,
    now() AS "timestamp"
   FROM pg_stat_database
  WHERE pg_stat_database.datname = current_database();
-- Create "v_strategy_allocations" view
CREATE VIEW "v_strategy_allocations" (
  "id",
  "strategy_id",
  "strategy_name",
  "symbol_id",
  "symbol",
  "allocated_capital",
  "used_capital",
  "available_capital",
  "reserved_capital",
  "current_position",
  "average_cost",
  "realized_pnl",
  "unrealized_pnl",
  "total_trades",
  "winning_trades",
  "win_rate",
  "allocation_percentage",
  "is_active",
  "last_trade_time",
  "created_at",
  "updated_at"
) AS SELECT sa.id,
    sa.strategy_id,
    s.name AS strategy_name,
    sa.symbol_id,
    sym.symbol,
    sa.allocated_capital,
    sa.used_capital,
    sa.available_capital,
    sa.reserved_capital,
    sa.current_position,
    sa.average_cost,
    sa.realized_pnl,
    sa.unrealized_pnl,
    sa.total_trades,
    sa.winning_trades,
        CASE
            WHEN sa.total_trades > 0 THEN round(sa.winning_trades::numeric / sa.total_trades::numeric * 100::numeric, 2)
            ELSE 0::numeric
        END AS win_rate,
    sa.allocation_percentage,
    sa.is_active,
    sa.last_trade_time,
    sa.created_at,
    sa.updated_at
   FROM public.strategy_allocations sa
     JOIN public.strategies s ON sa.strategy_id = s.id
     JOIN public.symbols sym ON sa.symbol_id = sym.id;
