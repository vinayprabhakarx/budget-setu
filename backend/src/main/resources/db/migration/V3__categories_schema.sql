CREATE TABLE categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    icon        VARCHAR(50),
    color       VARCHAR(20),
    type        VARCHAR(20)  NOT NULL,
    is_default  BOOLEAN      DEFAULT FALSE,
    created_at  TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX idx_categories_user_id ON categories(user_id);

-- Seed default expense categories
INSERT INTO categories (name, icon, color, type, is_default) VALUES
    ('Food',          '🍔', '#F97316', 'EXPENSE', TRUE),
    ('Transport',     '🚗', '#3B82F6', 'EXPENSE', TRUE),
    ('Shopping',      '🛍️', '#A855F7', 'EXPENSE', TRUE),
    ('Bills',         '📄', '#EF4444', 'EXPENSE', TRUE),
    ('Health',        '🏥', '#22C55E', 'EXPENSE', TRUE),
    ('Entertainment', '🎬', '#EC4899', 'EXPENSE', TRUE),
    ('Education',     '📚', '#14B8A6', 'EXPENSE', TRUE),
    ('Travel',        '✈️', '#F59E0B', 'EXPENSE', TRUE),
    ('Investment',    '📈', '#6366F1', 'EXPENSE', TRUE),
    ('Rent',          '🏠', '#8B5CF6', 'EXPENSE', TRUE),
    ('Loans',         '🏦', '#F43F5E', 'EXPENSE', TRUE),
    ('Loan EMI',      '💸', '#EF4444', 'EXPENSE', TRUE),
    ('Groceries',     '🛒', '#10B981', 'EXPENSE', TRUE),
    ('Dining Out',    '🍽️', '#F59E0B', 'EXPENSE', TRUE),
    ('Utilities',     '💡', '#EAB308', 'EXPENSE', TRUE),
    ('Subscription',  '📺', '#8B5CF6', 'EXPENSE', TRUE),
    ('Insurance',     '🛡️', '#3B82F6', 'EXPENSE', TRUE),
    ('Taxes',         '🏛️', '#64748B', 'EXPENSE', TRUE),
    ('Gifts',         '🎁', '#EC4899', 'EXPENSE', TRUE),
    ('Personal Care', '💈', '#F43F5E', 'EXPENSE', TRUE),
    ('Fuel/Petrol',   '⛽', '#EF4444', 'EXPENSE', TRUE),
    ('Transfer',      '🔄', '#8B5CF6', 'EXPENSE', TRUE),
    ('Uncategorized', '❓', '#A8A29E', 'EXPENSE', TRUE),
    ('Other',         '📦', '#A8A29E', 'EXPENSE', TRUE);

-- Seed default income categories
INSERT INTO categories (name, icon, color, type, is_default) VALUES
    ('Salary',        '💼', '#22C55E', 'INCOME', TRUE),
    ('Freelance',     '💻', '#3B82F6', 'INCOME', TRUE),
    ('Investment',    '📊', '#6366F1', 'INCOME', TRUE),
    ('Interest',      '🏦', '#10B981', 'INCOME', TRUE),
    ('Cashback',      '🤑', '#22C55E', 'INCOME', TRUE),
    ('Refund',        '🔙', '#06B6D4', 'INCOME', TRUE),
    ('Rental Income', '🏘️', '#8B5CF6', 'INCOME', TRUE),
    ('Bonus',         '🎊', '#F59E0B', 'INCOME', TRUE),
    ('Family/Gift',   '💝', '#EC4899', 'INCOME', TRUE),
    ('Other',         '💰', '#A8A29E', 'INCOME', TRUE);

-- Seed transfer category
INSERT INTO categories (name, icon, color, type, is_default) VALUES
    ('Self Transfer', '🔁', '#8B5CF6', 'TRANSFER', TRUE);
