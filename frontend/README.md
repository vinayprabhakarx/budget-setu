# BudgetSetu Frontend Dashboard

This directory contains the user interface of the BudgetSetu Personal Finance Manager. Built with **React 19**, **Vite**, and **Tailwind CSS v4**, it provides a responsive, dark-mode-first dashboard with data visualizations and automated workflow integrations.

---

## 🚀 Features

*   **🔒 Secured Routing & Session Auth**: Synchronized state management (`AuthContext`) safeguarding login and registration views (automatically creates a default "Cash Wallet" account upon user registration).
*   **📊 Interactive Financial Dashboard**: Rich data cards (Net Worth, Income, Expense, Savings) and charts (Donut category breakdowns, side-by-side Monthly trends) using **Recharts**.
*   **💸 Transactions Ledger**: Paginated transaction grid with search, date limits, category, account, and type filters, manual transaction logging (for cash spending or gains), editing capabilities, and a detailed **Audit History** log.
*   **📄 Statement Import Dropzone**: File dropzone supporting PDF, CSV, Excel, and HTML up to 20MB, linked to an asynchronous polling mechanism for parsing logs (automatically prompts the user with an encrypted file dialog for password decryption on protected uploads).
*   **🎯 Budgets & Goals**: Configurable category budget limits with color alerts (safe, warning, over-budget) and savings milestones with direct funding support.
*   **🏦 Bank Account Profiles**: Create multiple account profiles (Savings, Current, Credit Card, Cash) grouped by bank name, view dynamically calculated balances, delete profiles (cascading statements and transactions), and merge duplicate account entries.
*   **🌗 Adaptive Time Theme Mode**: Automatically enables dark mode between 7 PM and 7 AM local time, with options to manually lock Light or Dark preferences.
*   **📤 Data Exporting**: Generate and print clean PDF statements or download transaction history directly as a CSV.

---

## 🛠️ Tech Stack

*   **Framework**: React 19
*   **Build Tool**: Vite & TypeScript
*   **Styles**: Tailwind CSS v4
*   **Charts**: Recharts
*   **Icons**: Lucide React
*   **API Client**: Axios with interceptors

---

## 📁 Project Structure

```text
frontend/
├── src/
│   ├── api/                  # Axios configuration and API interceptors
│   ├── components/
│   │   ├── layout/           # Main sidebar & topbar layout (MainLayout.tsx)
│   │   └── shared/           # Modals (AddTransaction, ThemeToggle, Toast)
│   ├── context/              # Context Providers (Auth, Toast, DateFilter)
│   ├── pages/                # Core Application Pages
│   │   ├── Dashboard.tsx     # High-level summary of financial health and recent activity
│   │   ├── Accounts.tsx      # Manage financial accounts (banks, credit cards, cash)
│   │   ├── Analytics.tsx     # In-depth visual insights, trends, and categorical breakdowns
│   │   ├── Budgets.tsx       # Hub for active budget plans, recurring expenses, and savings goals
│   │   ├── Import.tsx        # Bulk transaction importing via file uploads (CSV, OFX)
│   │   ├── ImportDetails.tsx # Granular results and summaries of specific import jobs
│   │   └── Transactions.tsx  # Comprehensive view, filtering, and editing of all transactions
│   ├── utils/                # Helper tools (Currency format, theme engine)
│   ├── App.tsx               # App routing and layout binding
│   ├── index.css             # Main styling entry point and tokens
│   └── main.tsx              # React mounting root
├── tsconfig.json             # TS Compiler configurations
└── vite.config.ts            # Vite bundler configurations
```

---

## 💻 Getting Started

### 1. Installation
Install project dependencies (using Bun or NPM):
```bash
bun install
# or
npm install
```

### 2. Environment Variables
Create a `.env` file in the `frontend` root based on `.env.example`:
```env
VITE_API_BASE_URL=http://localhost:8080/api
```
*(If the backend is running on a different port/host, update the URL here).*

### 3. Run the Development Server
Start the hot-reloading development server locally:
```bash
bun run dev
# or: npm run dev
```
By default, the server runs on `http://localhost:5173`. Make sure the BudgetSetu backend server is running!

### 4. Code Quality & Linting
Run the ESLint checker to ensure code quality:
```bash
bun run lint
# or: npm run lint
```

### 5. Production Compilation
Compile and optimize for production:
```bash
bun run build
# or: npm run build
```
This builds static assets into the `dist/` folder.

### 6. Preview Build
Preview the built production app locally:
```bash
bun run preview
# or: npm run preview
```
