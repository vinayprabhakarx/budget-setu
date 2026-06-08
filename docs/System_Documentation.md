# BudgetSetu System Documentation

This document outlines the core operational behaviors of the BudgetSetu backend, verified through automated integration testing.

## Core Entities and CRUD Operations

The system provides complete Create, Read, Update, and Delete operations for the following core entities:
*   **Accounts**: Financial accounts (e.g., Bank, Credit Card).
*   **Transactions**: Individual income or expense ledger entries tied to an Account.
*   **Budget Plans**: Spending limits set across different periods (Weekly, Monthly, Yearly).
*   **Goals**: Target savings milestones.
*   **Categories**: System-wide default categories, or user-defined custom categories.
*   **Recurring Expenses**: Upcoming recurring debits or credits.

> [!TIP]
> **Data Integrity Constraint:** The system strictly enforces referential integrity. Direct deletion of an Account via the database or raw repository will fail if Transactions exist. You must use `AccountService.deleteAccount()`, which gracefully handles the cascade by first removing related `transactions` and `statement_imports`.

## User Account Deletion & Cascading (Hard Deletion)

BudgetSetu operates on a strict **Hard Deletion** policy upon user account termination.

When a user initiates account deletion (`UserService.deleteUserAccount`), the following entities are permanently scrubbed from the database via SQL Cascades and Service-level deletes:
1.  **User Record** (`users`)
2.  **All Financial Accounts** (`accounts`)
3.  **All Ledger Entries** (`transactions`)
4.  **All Budgets** (`budget_plans`)
5.  **All Savings Goals** (`goals`)
6.  **All Custom Categories** (`categories`)
7.  **All Statement Import Logs** (`statement_imports`)

> [!CAUTION]
> Account deletion is instantaneous and irreversible. All associated records are permanently wiped from the relational database without any tombstoning (`is_deleted = true`).

## Backup and Restore Architecture

The system supports a robust export/import mechanism for disaster recovery and account migration.

### Export Behavior
*   When exporting, the system queries all data owned by the User ID, serializes it to JSON, and packages it into a standard ZIP archive.
*   The archive is encrypted/secured in-memory before transmission, ensuring sensitive financial histories are protected.

### Restore Behavior
*   **Non-Destructive Restores**: Restoring from a backup adds records to the user's workspace without dropping current data.
*   **Deduplication via Fingerprinting**: The backend uses unique `fingerprint` markers on `Transactions`. If a transaction in the backup has the exact same fingerprint as a transaction already in the database, the system ignores it during restore. This allows users to safely restore a backup without worrying about doubling their expenses.
*   **Account Merging**: Accounts are restored seamlessly. If an account with the exact same name and type exists, the restored transactions will automatically attach to the existing account.

## Test Strategy and Suite Layout
The testing infrastructure has been refactored into focused, feature-based suites located in `backend/src/test/java/com/budgetsetu/backend/`.

1.  `BaseIntegrationTest.java`: Handles boilerplate database and test-user initialization.
2.  `CrudIntegrationTest.java`: Verifies basic operational integrity.
3.  `UserDeletionIntegrationTest.java`: Employs raw JDBC queries to verify 100% data wiping on account deletion.
4.  `BackupRestoreIntegrationTest.java`: Verifies zip file creation, deserialization, and duplicate conflict avoidance.
5.  `AuthIntegrationTest.java`: Verifies auth flow and handles Redis rate limit testing.

## Polyglot Persistence: PostgreSQL and MongoDB

BudgetSetu employs a polyglot persistence architecture, using two distinct database engines based on workload requirements.

### PostgreSQL (Relational Integrity)
Used for structured financial data that requires ACID compliance and complex joining.
- **Entities**: Users, Accounts, Transactions, Budgets, Categories, Goals.
- **Why**: Enforces foreign key constraints preventing orphaned transactions, and guarantees precision math for financial ledgers.

### MongoDB (High-Volume Unstructured Logs)
Used as a high-throughput, schema-less datastore for logs and configurations.
- **Entities**: 
  - `AuditEvent`: Appends every field modification. Stored asynchronously to prevent blocking API threads.
  - `ImportLog`: Contains massive arrays of parsed rows during CSV/PDF uploads. A single MongoDB document easily holds 1,000+ embedded row events without needing 1,000 slow relational inserts.
  - `MerchantRule`: Stores flexible, deeply nested pattern-matching rules for auto-categorization.

## Redis Caching & Free-Tier Optimization

The application utilizes `StringRedisTemplate` for high-speed read queries on the Analytics, Dashboard, and Budget endpoints.

> [!TIP]
> **Free-Tier Optimized Eviction:** Redis eviction uses `opsForHash()` instead of `keys()`. When a transaction is modified, the backend runs a single O(1) `HDEL` command to invalidate the user's cached maps instead of an O(N) pattern scan, protecting single-threaded free-tier Redis engines from blocking.

## Logging Strategy

The backend is configured with a robust Logback setup (`logback-spring.xml`) for production diagnostics.

- **Console Appender**: Color-coded, detailed output active on the `dev` profile.
- **Application Log (`logs/application.log`)**: Rolls daily, triggering a split if it exceeds `10MB`, and retains 30 days of standard system history.
- **Error Log (`logs/error.log`)**: A dedicated stream restricted exclusively to `ERROR` level logs, retained for 60 days. This allows engineers to instantly isolate stack traces without sifting through noise.
