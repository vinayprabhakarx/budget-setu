# BudgetSetu — Personal Finance Management Application

BudgetSetu is a statement-first personal finance application designed to help users aggregate, deduplicate, auto-categorize, and visualize transactions from UPI apps (PhonePe, Google Pay) and bank accounts (HDFC, ICICI, SBI) via PDF/CSV statement imports.

---

## Key Features

- **Automated Categorization**: Rule-based matching engine that tags transactions to categories (Food, Bills, Transport, etc.).
- **Transaction Deduplication**: SHA-256 fingerprint hashing prevents importing duplicate transactions.
- **Budget Tracking**: Custom monthly spending limits with notification triggers at 75%, 90%, and 100% of limits.
- **Savings Goals**: Active tracking of savings targets.
- **Unified Tabbed Interface**: Seamless navigation between Bank Accounts and Statement Uploads, as well as Budgets, Goals, and Recurring Expenses.
- **Data Export & Restore**: Comprehensive account backup system to export and restore user data safely via ZIP archives.
- **Authentication & User Profile**: Secure login/registration flows with real-time form validation, password updates, and email verification via magic links.
- **Enhanced Data Privacy**: Integrated cookie consent management and strictly scoped transaction boundaries with secure session cache auto-clearing.
- **UI Consistency & Mobile Design**: Semantic token-based dynamic styling for progress bars, alerts, and loading states across the platform, fully responsive for desktop and mobile screens.
- **Interactive Dashboard**: Financial health summary, categories breakdown, cashflow trends, and transaction history.
- **Secure by Design**: Row-Level Security (RLS) policies, bcrypt password hashing, and stateless JWT architecture with HTTP-Only refresh cookies.

---

## Technology Stack

### Backend (Server)
- **Runtime**: Java 25 (LTS) / Spring Boot 4.0.6
- **Build Tool**: Maven 3.9.x (LTS)
- **Security**: Spring Security (Stateless JWT token verification, BCrypt hashing)
- **Database Migrations**: Flyway
- **Databases (Polyglot Strategy)**:
  - **PostgreSQL 16**: Relational core (Users, Accounts, Transactions, Budgets, Goals)
  - **MongoDB 7**: Flexible documents (Merchant Rules, Import Logs, Audit Trails)
  - **Redis 7**: Caching (Dashboard metrics, session logs)
- **Third-Party Integrations**: Mailgun (transaction reports & alerts)

### Frontend (Client)
- **Runtime & PM**: ReactJS 19 with **Bun** package manager
- **Styling**: Tailwind CSS v4
- **State Management**: Redux Toolkit
- **Visualizations**: Recharts

---

## Project Structure

```
BudgetSetu/
├── docker-compose.yml              # Local container stack (Postgres, Mongo, Redis)
├── docs/                           # Documentation folder (Specs & Development Progress)
├── backend/                        # Spring Boot 4.x API service
│   ├── src/main/java/com/budgetsetu/ # Java Source Code
│   └── src/main/resources/         # Configuration & Database Migrations
└── frontend/                       # ReactJS 19 / Bun / Tailwind v4 SPA Application
    └── src/pages/app/              # Core Application Pages
        ├── Dashboard.tsx           # High-level summary of financial health and recent activity
        ├── Accounts.tsx            # Manage financial accounts (banks, credit cards, cash)
        ├── Analytics.tsx           # In-depth visual insights, trends, and categorical breakdowns
        ├── Budgets.tsx             # Hub for active budget plans, recurring expenses, and savings goals
        ├── Import.tsx              # Bulk transaction importing via file uploads (CSV, OFX)
        ├── ImportDetails.tsx       # Granular results and summaries of specific import jobs
        └── Transactions.tsx        # Comprehensive view, filtering, and editing of all transactions
```

---

## Local Development Setup

### 1. Prerequisites
Ensure you have the following installed on your machine:
- **Java 25 (LTS)**
- **Maven 3.9.x (LTS)** (Included in maven wrapper `./mvnw`)
- **Bun** (Node.js alternative runtime & package manager)
- **Docker** and **Docker Compose** (optional/recommended for local database development)

### 2. Start the Databases
Run the Docker Compose stack to boot up PostgreSQL, MongoDB, and Redis instances with preconfigured health checks:

```bash
docker compose up -d
```

Verify that all three database containers are healthy:
```bash
docker compose ps
```

### 3. Configure Environment Variables
Inside the `backend` directory, duplicate the `.env.example` file and save it as `.env`:

```bash
cp backend/.env.example backend/.env
```
*(Optionally modify database credentials or JWT keys inside the `.env` file.)*

### 4. Running the Backend Server
Navigate to the backend directory and launch the Spring Boot application using the Maven wrapper:

```bash
cd backend
chmod +x mvnw
./mvnw spring-boot:run
```
*Note: The application's custom loader automatically reads the `.env` file during startup.*

The server starts on port **8080** by default. Check health status at:
`http://localhost:8080/api/health`

### 5. Running the Frontend client
Navigate to the frontend directory, install the packages, and run the dev server using **Bun**:
```bash
cd frontend
bun install
bun run dev
```

---

## API Testing Reference

You can run these sample `curl` commands to test the backend API when running locally.

### 1. Health Check
```bash
curl http://localhost:8080/api/health
```

### 2. Multi-Service Diagnostics Check
Runs a self-test of connections to PostgreSQL (Supabase), MongoDB (Atlas), Redis (Redis Cloud), and SMTP/Mailgun:
```bash
curl http://localhost:8080/api/health/diagnostics
```

#### Optional: Dispatch a real test mail to a specific recipient:
```bash
curl "http://localhost:8080/api/health/diagnostics?email=your_email@example.com"
```

### 3. Register a New Account
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Arjun Sharma",
    "email": "arjun@example.com",
    "password": "SecurePassword123!"
  }'
```

### 4. Log In to Retrieve Access Token
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "arjun@example.com",
    "password": "SecurePassword123!"
  }'
```

### 5. Create a Financial Account (Requires Auth Bearer Token)
Replace `YOUR_JWT_TOKEN` with the `accessToken` returned from the login response.

```bash
curl -X POST http://localhost:8080/api/accounts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "HDFC Savings Account",
    "bankName": "HDFC Bank",
    "accountNumber": "XXXX4321",
    "accountType": "SAVINGS",
    "currency": "INR"
  }'
```

### 6. Add a Manual Transaction
```bash
curl -X POST http://localhost:8080/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "accountId": "INSERT_ACCOUNT_UUID_HERE",
    "amount": 2500.50,
    "transactionType": "EXPENSE",
    "transactionDate": "2026-06-08",
    "merchantName": "Swiggy",
    "purpose": "Food Delivery",
    "note": "Dinner party with friends",
    "tags": ["food", "social"]
  }'
```

---

## Production Deployment

### 1. Backend (Spring Boot)
Build the executable JAR file for production:
```bash
cd backend
./mvnw clean package -DskipTests
```
Run the compiled JAR file, passing your production environment profile:
```bash
export SPRING_PROFILES_ACTIVE=prod
java -jar target/backend-0.0.1-SNAPSHOT.jar
```
*Note: Using the `prod` profile will automatically load properties from `.env.production`.*

### 2. Frontend (React/Vite)
Compile the optimized production bundle:
```bash
cd frontend
bun run build
```
The static assets will be output to the `frontend/dist/` directory. You can serve this directory using a web server like Nginx, Apache, or a simple Node HTTP server (e.g., `npx serve -s dist`).
