CREATE TABLE goals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    target_amount   NUMERIC(15, 2) NOT NULL,
    saved_amount    NUMERIC(15, 2) DEFAULT 0.00,
    target_date     DATE,
    status          VARCHAR(20)  DEFAULT 'ACTIVE',
    priority        VARCHAR(20)  DEFAULT 'MEDIUM',
    description     TEXT,
    created_at      TIMESTAMP    DEFAULT NOW(),
    updated_at      TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_goals_status  ON goals(user_id, status);
