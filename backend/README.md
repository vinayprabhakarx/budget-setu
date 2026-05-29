# BudgetSetu Backend Server

The BudgetSetu backend is a robust personal finance management application built on Spring Boot 4.0.6 and Java 25. It provides secure user management, financial account control, transaction tracking with soft-delete capabilities, monthly budgeting limits, savings goals with progress contributions, dashboard summaries, and automated statement parsing with intra-batch duplicate transaction prevention.

---

## 🛠️ Technology Stack
- **Framework:** Spring Boot 4.0.6 (Spring Web, JPA, Security, Scheduler)
- **Language:** Java 25
- **Primary Database:** PostgreSQL 16 (handled via Hibernate / Flyway Schema Migrations)
- **Document Store:** MongoDB 7 (for append-only Audit Trails and Import logs)
- **Cache / Session Store:** Redis 7
- **Authentication:** JWT (Stateless Bearer Tokens)
- **Notification Services:** JavaMailSender (integrated with Mailgun SMTP)

---

## ⚙️ Configuration (.env)
The server loads environment variables from a `.env` file located in the root of the `backend` directory. Configure these variables for proper operation:

```env
# Relational Database (PostgreSQL)
POSTGRES_URL=jdbc:postgresql://<host>:<port>/<db_name>?sslmode=require
POSTGRES_USER=<user>
POSTGRES_PASSWORD=<password>
POSTGRES_DB=<db_name>

# Document Database (MongoDB Atlas)
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/
MONGODB_DATABASE=budgetsetu

# Cache & Rate Limiting (Redis)
REDIS_HOST=<redis_host>
REDIS_PORT=6379
REDIS_USERNAME=default
REDIS_PASSWORD=<redis_password>

# JWT Security Configurations
JWT_SECRET=<at_least_64_char_HS512_secret_key>
JWT_EXPIRATION_MS=900000

# Mail Server Configurations
MAIL_HOST=smtp.mailgun.org
MAIL_PORT=587
MAIL_USERNAME=<mailgun_username>
MAIL_PASSWORD=<mailgun_password>
MAIL_FROM_EMAIL=no-reply@budgetsetu.app
```

---

## 🚀 Build, Run & Test

### Build the Application
```bash
./mvnw clean compile
```

### Run the Application locally
```bash
./mvnw spring-boot:run
```
The server will start and listen on port `8080` (e.g. `http://localhost:8080`).

### Run the Integration Test Suite
```bash
./mvnw test
```

---

## 📡 API Endpoints

### 🔑 Authentication (`/api/auth`)
| HTTP Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| **POST** | `/api/auth/register` | ❌ | Registers a new user account (automatically instantiates a default cash wallet account named "Cash"). |
| **POST** | `/api/auth/login` | ❌ | Log in and receive a stateless JWT access token. |
| **POST** | `/api/auth/logout` | ❌ | Invalidates user session tokens. |

### 💳 Bank Accounts (`/api/accounts`)
| HTTP Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| **GET** | `/api/accounts` |  | Retrieves all active accounts for the authenticated user. |
| **GET** | `/api/accounts/{id}` |  | Retrieves details for a specific bank account. |
| **POST** | `/api/accounts` |  | Creates a new financial account (CHECKING, SAVINGS, CREDIT_CARD, etc.). |
| **PUT** | `/api/accounts/{id}` |  | Modifies/updates manual bank account details. |
| **DELETE** | `/api/accounts/{id}` |  | Deletes an account, cascading to its statements and transactions. |
| **POST** | `/api/accounts/merge` |  | Merges a source account into a destination account. |

### 💸 Transactions (`/api/transactions`)
| HTTP Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| **GET** | `/api/transactions` |  | Lists paginated transactions. |
| **GET** | `/api/transactions/{id}` |  | Retrieves details of a specific transaction. |
| **POST** | `/api/transactions` |  | Manually registers a new transaction. |
| **PUT** | `/api/transactions/{id}` |  | Modifies transaction details (full update). |
| **PATCH** | `/api/transactions/{id}` |  | Modifies specific transaction fields (partial update). |
| **DELETE** | `/api/transactions/{id}` |  | Performs a soft-delete on a transaction. |
| **GET** | `/api/transactions/{id}/history` |  | Fetches the complete append-only audit trail logs from MongoDB. |

### 📂 Statement Imports (`/api/import`)
| HTTP Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| **POST** | `/api/import/upload` |  | Uploads a bank statement (CSV, PDF, etc.) asynchronously. Expects file and sourceName, with optional `accountId` and `password` (for decrypting encrypted PDFs). If `accountId` is omitted, the system auto-discovers or creates the account profile using bank details parsed from the statement. |
| **GET** | `/api/import/{importId}/status` |  | Polls the status and processing statistics of the upload. |

### 📊 Monthly Budgets (`/api/budget-plans`)
| HTTP Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| **GET** | `/api/budget-plans` |  | Fetches categories budget list for a specific month and year. |
| **POST** | `/api/budget-plans` |  | Creates or updates (upserts) a budget limit for a category. |
| **PUT** | `/api/budget-plans/{id}` |  | Modifies budget settings. |
| **DELETE** | `/api/budget-plans/{id}` |  | Deletes a budget threshold setting. |

### 🎯 Savings Goals (`/api/goals`)
| HTTP Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| **GET** | `/api/goals` |  | Lists all savings targets. |
| **POST** | `/api/goals` |  | Instantiates a new savings target goal. |
| **POST** | `/api/goals/{id}/contribute` |  | Contributes a specific savings amount to the goal. |
| **PUT** | `/api/goals/{id}` |  | Updates target amount, target date, or name of a goal. |
| **DELETE** | `/api/goals/{id}` |  | Deletes a savings goal. |

### 📈 Dashboard Summary (`/api/dashboard`)
| HTTP Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| **GET** | `/api/dashboard/summary` |  | Compiles total income, expenses, trends, and category breakdown. |

### 📊 Analytics (`/api/analytics`)
| HTTP Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| **GET** | `/api/analytics` |  | Retrieves deep-dive analytical charts and historical data for the user. |

### 📁 Backup & Export (`/api/backup`)
| HTTP Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| **POST** | `/api/backup/export` |  | Generates a full ZIP export of the user's data. |
| **POST** | `/api/backup/import` |  | Restores a user's account from a previous ZIP export. |

### 🏷️ Categories (`/api/categories`)
| HTTP Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| **GET** | `/api/categories` |  | Retrieves system and custom transaction categories. |

### 🔄 Recurring Expenses (`/api/recurring-expenses`)
| HTTP Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| **GET** | `/api/recurring-expenses` |  | Lists all recurring bills and subscriptions. |
| **POST** | `/api/recurring-expenses` |  | Creates a new recurring expense schedule. |
| **PUT** | `/api/recurring-expenses/{id}` |  | Modifies a recurring expense. |
| **DELETE** | `/api/recurring-expenses/{id}` |  | Deletes a recurring expense schedule. |

### 👤 User Profile (`/api/users`)
| HTTP Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| **GET** | `/api/users/me` |  | Retrieves the authenticated user's profile information. |
| **PUT** | `/api/users/me` |  | Updates the user's profile details. |

### 🩺 Health Checks & Diagnostics (`/api`)
| HTTP Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| **GET** | `/api/health` | ❌ | Returns the basic status of the backend application server. |
| **GET** | `/api/health/diagnostics` | ❌ | Performs end-to-end ping check on PostgreSQL, MongoDB, Redis, and SMTP. |

---

## 🪵 Audit Logs Schema (MongoDB)
Each transaction modification (Create, Update, Soft-delete) triggers an event recorded in the `audit_events` document collection in MongoDB. Users can fetch audit changes via `/api/transactions/{id}/history` to track modifications transparently:
- **`fieldChanged`:** The property updated (e.g. `amount`, `note`, `tags`).
- **`oldValue` / `newValue`:** Previous and new state values.
- **`source`:** Source classification (e.g., `USER`, `SYSTEM`).
- **`timestamp`:** UTC timestamp when the event occurred.
