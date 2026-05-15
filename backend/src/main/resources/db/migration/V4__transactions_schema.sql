CREATE TABLE transactions (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id        UUID         NOT NULL REFERENCES accounts(id),
    category_id       UUID         REFERENCES categories(id),

    amount            NUMERIC(15, 2) NOT NULL,
    transaction_type  VARCHAR(20) NOT NULL,
    transaction_date  DATE        NOT NULL,
    payee             VARCHAR(255),
    description       TEXT,
    tags              TEXT[],
    payment_mode      VARCHAR(30),

    source            VARCHAR(20) DEFAULT 'MANUAL',
    reference_number  VARCHAR(255),
    raw_description   TEXT,
    category_source   VARCHAR(20),
    fingerprint       VARCHAR(512) UNIQUE,

    running_balance   NUMERIC(15, 2),

    is_deleted        BOOLEAN   DEFAULT FALSE,
    deleted_at        TIMESTAMP,
    created_at        TIMESTAMP DEFAULT NOW(),
    updated_at        TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_id     ON transactions(user_id);
CREATE INDEX idx_transactions_date        ON transactions(transaction_date);
CREATE INDEX idx_transactions_category    ON transactions(category_id);
CREATE INDEX idx_transactions_account     ON transactions(account_id);
CREATE INDEX idx_transactions_fingerprint ON transactions(fingerprint);
CREATE INDEX idx_transactions_type        ON transactions(transaction_type);
CREATE INDEX idx_transactions_not_deleted ON transactions(user_id, is_deleted) WHERE is_deleted = FALSE;
CREATE INDEX idx_transactions_analytics_perf ON transactions(user_id, transaction_type, transaction_date) WHERE is_deleted = false;
CREATE INDEX idx_transactions_category_perf ON transactions(user_id, category_id, transaction_type, transaction_date) WHERE is_deleted = false;
