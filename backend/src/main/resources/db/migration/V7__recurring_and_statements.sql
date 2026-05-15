CREATE TABLE statement_imports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id      UUID         REFERENCES accounts(id),
    bank_key        VARCHAR(255),
    file_name       VARCHAR(255),
    file_url        TEXT,
    source          VARCHAR(100),
    period_start    DATE,
    period_end      DATE,
    status          VARCHAR(20)  DEFAULT 'PENDING',
    total_found     INTEGER      DEFAULT 0,
    new_imported    INTEGER      DEFAULT 0,
    duplicates      INTEGER      DEFAULT 0,
    error_message   TEXT,
    created_at      TIMESTAMP    DEFAULT NOW(),
    completed_at    TIMESTAMP
);

CREATE INDEX idx_statement_imports_user_id ON statement_imports(user_id);
CREATE INDEX idx_statement_imports_status  ON statement_imports(status);

CREATE TABLE recurring_expenses (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    start_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    paused_until DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recurring_expenses_user_id ON recurring_expenses(user_id);
