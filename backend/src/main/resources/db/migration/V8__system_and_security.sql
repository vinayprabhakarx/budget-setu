CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       VARCHAR(512) UNIQUE NOT NULL,
    expires_at  TIMESTAMP    NOT NULL,
    revoked     BOOLEAN      DEFAULT FALSE,
    created_at  TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token   ON refresh_tokens(token);

CREATE TABLE infrastructure_metrics (
    id UUID PRIMARY KEY,
    recorded_at TIMESTAMP NOT NULL,
    cpu_usage_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
    memory_used_mb NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    pg_active_connections INTEGER NOT NULL DEFAULT 0,
    redis_connected_clients INTEGER NOT NULL DEFAULT 0,
    mongo_active_connections INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_infra_metrics_recorded_at ON infrastructure_metrics(recorded_at);

-- Enable RLS on all user-owned tables
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE statement_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_expenses ENABLE ROW LEVEL SECURITY;

-- Force RLS so that even the table owner (budgetsetu_user) has RLS enforced
ALTER TABLE accounts FORCE ROW LEVEL SECURITY;
ALTER TABLE transactions FORCE ROW LEVEL SECURITY;
ALTER TABLE budget_plans FORCE ROW LEVEL SECURITY;
ALTER TABLE goals FORCE ROW LEVEL SECURITY;
ALTER TABLE statement_imports FORCE ROW LEVEL SECURITY;
ALTER TABLE recurring_expenses FORCE ROW LEVEL SECURITY;

-- Create policies that allow access if app.current_user_id is set to 'system'
-- or if user_id (cast to text) matches the app.current_user_id session variable.
-- Note: 'system' context is used by background schedulers to bypass isolation.

CREATE POLICY accounts_rls_policy ON accounts
    USING (
        current_setting('app.current_user_id', true) = 'system'
        OR user_id::text = current_setting('app.current_user_id', true)
    );

CREATE POLICY transactions_rls_policy ON transactions
    USING (
        current_setting('app.current_user_id', true) = 'system'
        OR user_id::text = current_setting('app.current_user_id', true)
    );

CREATE POLICY budget_plans_rls_policy ON budget_plans
    USING (
        current_setting('app.current_user_id', true) = 'system'
        OR user_id::text = current_setting('app.current_user_id', true)
    );

CREATE POLICY goals_rls_policy ON goals
    USING (
        current_setting('app.current_user_id', true) = 'system'
        OR user_id::text = current_setting('app.current_user_id', true)
    );

CREATE POLICY statement_imports_rls_policy ON statement_imports
    USING (
        current_setting('app.current_user_id', true) = 'system'
        OR user_id::text = current_setting('app.current_user_id', true)
    );

CREATE POLICY recurring_expenses_rls_policy ON recurring_expenses
    USING (
        current_setting('app.current_user_id', true) = 'system'
        OR user_id::text = current_setting('app.current_user_id', true)
    );
