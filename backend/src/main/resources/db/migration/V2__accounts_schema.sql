CREATE TABLE accounts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    bank_name       VARCHAR(255),
    account_number  VARCHAR(50),
    account_type    VARCHAR(50)  NOT NULL,
    balance         NUMERIC(15, 2) DEFAULT 0.00,
    manual_balance  NUMERIC(15, 2),
    manual_balance_date DATE,
    currency        VARCHAR(10)  DEFAULT 'INR',
    is_active       BOOLEAN      DEFAULT TRUE,
    created_at      TIMESTAMP    DEFAULT NOW(),
    updated_at      TIMESTAMP    DEFAULT NOW(),

    UNIQUE(user_id, name)
);

CREATE INDEX idx_accounts_user_id ON accounts(user_id);
