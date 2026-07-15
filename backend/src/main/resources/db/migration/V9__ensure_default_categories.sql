-- Ensure default expense categories exist if missing
INSERT INTO categories (name, icon, color, type, is_default)
SELECT 'Food',          '🍔', '#F97316', 'EXPENSE', TRUE
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE user_id IS NULL AND name = 'Food');

INSERT INTO categories (name, icon, color, type, is_default)
SELECT 'Transport',     '🚗', '#3B82F6', 'EXPENSE', TRUE
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE user_id IS NULL AND name = 'Transport');

INSERT INTO categories (name, icon, color, type, is_default)
SELECT 'Shopping',      '🛍️', '#A855F7', 'EXPENSE', TRUE
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE user_id IS NULL AND name = 'Shopping');

INSERT INTO categories (name, icon, color, type, is_default)
SELECT 'Bills',         '📄', '#EF4444', 'EXPENSE', TRUE
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE user_id IS NULL AND name = 'Bills');

INSERT INTO categories (name, icon, color, type, is_default)
SELECT 'Health',        '🏥', '#22C55E', 'EXPENSE', TRUE
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE user_id IS NULL AND name = 'Health');

INSERT INTO categories (name, icon, color, type, is_default)
SELECT 'Entertainment', '🎬', '#EC4899', 'EXPENSE', TRUE
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE user_id IS NULL AND name = 'Entertainment');

INSERT INTO categories (name, icon, color, type, is_default)
SELECT 'Education',     '📚', '#14B8A6', 'EXPENSE', TRUE
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE user_id IS NULL AND name = 'Education');

INSERT INTO categories (name, icon, color, type, is_default)
SELECT 'Travel',        '✈️', '#F59E0B', 'EXPENSE', TRUE
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE user_id IS NULL AND name = 'Travel');

INSERT INTO categories (name, icon, color, type, is_default)
SELECT 'Investment',    '📈', '#6366F1', 'EXPENSE', TRUE
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE user_id IS NULL AND name = 'Investment' AND type = 'EXPENSE');

INSERT INTO categories (name, icon, color, type, is_default)
SELECT 'Rent',          '🏠', '#8B5CF6', 'EXPENSE', TRUE
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE user_id IS NULL AND name = 'Rent');

INSERT INTO categories (name, icon, color, type, is_default)
SELECT 'Loans',         '🏦', '#F43F5E', 'EXPENSE', TRUE
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE user_id IS NULL AND name = 'Loans');

INSERT INTO categories (name, icon, color, type, is_default)
SELECT 'Loan EMI',      '💸', '#EF4444', 'EXPENSE', TRUE
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE user_id IS NULL AND name = 'Loan EMI');

INSERT INTO categories (name, icon, color, type, is_default)
SELECT 'Groceries',     '🛒', '#10B981', 'EXPENSE', TRUE
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE user_id IS NULL AND name = 'Groceries');

INSERT INTO categories (name, icon, color, type, is_default)
SELECT 'Dining Out',    '🍽️', '#F59E0B', 'EXPENSE', TRUE
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE user_id IS NULL AND name = 'Dining Out');

INSERT INTO categories (name, icon, color, type, is_default)
SELECT 'Utilities',     '💡', '#EAB308', 'EXPENSE', TRUE
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE user_id IS NULL AND name = 'Utilities');

INSERT INTO categories (name, icon, color, type, is_default)
SELECT 'Subscription',  '📺', '#8B5CF6', 'EXPENSE', TRUE
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE user_id IS NULL AND name = 'Subscription');

INSERT INTO categories (name, icon, color, type, is_default)
SELECT 'Insurance',     '🛡️', '#3B82F6', 'EXPENSE', TRUE
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE user_id IS NULL AND name = 'Insurance');

INSERT INTO categories (name, icon, color, type, is_default)
SELECT 'Taxes',         '🏛️', '#64748B', 'EXPENSE', TRUE
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE user_id IS NULL AND name = 'Taxes');

INSERT INTO categories (name, icon, color, type, is_default)
SELECT 'Gifts',         '🎁', '#EC4899', 'EXPENSE', TRUE
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE user_id IS NULL AND name = 'Gifts');

INSERT INTO categories (name, icon, color, type, is_default)
SELECT 'Personal Care', '💈', '#F43F5E', 'EXPENSE', TRUE
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE user_id IS NULL AND name = 'Personal Care');

INSERT INTO categories (name, icon, color, type, is_default)
SELECT 'Fuel/Petrol',   '⛽', '#EF4444', 'EXPENSE', TRUE
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE user_id IS NULL AND name = 'Fuel/Petrol');

INSERT INTO categories (name, icon, color, type, is_default)
SELECT 'Transfer',      '🔄', '#8B5CF6', 'EXPENSE', TRUE
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE user_id IS NULL AND name = 'Transfer');

INSERT INTO categories (name, icon, color, type, is_default)
SELECT 'Uncategorized', '❓', '#A8A29E', 'EXPENSE', TRUE
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE user_id IS NULL AND name = 'Uncategorized');

INSERT INTO categories (name, icon, color, type, is_default)
SELECT 'Other',         '📦', '#A8A29E', 'EXPENSE', TRUE
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE user_id IS NULL AND name = 'Other' AND type = 'EXPENSE');

-- Seed default income categories
INSERT INTO categories (name, icon, color, type, is_default)
SELECT 'Salary',        '💼', '#22C55E', 'INCOME', TRUE
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE user_id IS NULL AND name = 'Salary');

INSERT INTO categories (name, icon, color, type, is_default)
SELECT 'Freelance',     '💻', '#3B82F6', 'INCOME', TRUE
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE user_id IS NULL AND name = 'Freelance');

INSERT INTO categories (name, icon, color, type, is_default)
SELECT 'Investment',    '📊', '#6366F1', 'INCOME', TRUE
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE user_id IS NULL AND name = 'Investment' AND type = 'INCOME');

INSERT INTO categories (name, icon, color, type, is_default)
SELECT 'Interest',      '🏦', '#10B981', 'INCOME', TRUE
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE user_id IS NULL AND name = 'Interest');

INSERT INTO categories (name, icon, color, type, is_default)
SELECT 'Cashback',      '🤑', '#22C55E', 'INCOME', TRUE
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE user_id IS NULL AND name = 'Cashback');

INSERT INTO categories (name, icon, color, type, is_default)
SELECT 'Refund',        '🔙', '#06B6D4', 'INCOME', TRUE
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE user_id IS NULL AND name = 'Refund');

INSERT INTO categories (name, icon, color, type, is_default)
SELECT 'Rental Income', '🏘️', '#8B5CF6', 'INCOME', TRUE
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE user_id IS NULL AND name = 'Rental Income');

INSERT INTO categories (name, icon, color, type, is_default)
SELECT 'Bonus',         '🎊', '#F59E0B', 'INCOME', TRUE
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE user_id IS NULL AND name = 'Bonus');

INSERT INTO categories (name, icon, color, type, is_default)
SELECT 'Family/Gift',   '💝', '#EC4899', 'INCOME', TRUE
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE user_id IS NULL AND name = 'Family/Gift');

INSERT INTO categories (name, icon, color, type, is_default)
SELECT 'Other',         '💰', '#A8A29E', 'INCOME', TRUE
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE user_id IS NULL AND name = 'Other' AND type = 'INCOME');

-- Seed transfer category
INSERT INTO categories (name, icon, color, type, is_default)
SELECT 'Self Transfer', '🔁', '#8B5CF6', 'TRANSFER', TRUE
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE user_id IS NULL AND name = 'Self Transfer');
