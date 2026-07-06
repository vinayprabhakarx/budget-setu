import React from "react";
import { Link } from "react-router-dom";
import { PublicLayout } from "../../components/layout/PublicLayout";
import { Shield, FileText, ArrowRight, RefreshCw, Trash2 } from "lucide-react";

export const Hero: React.FC = () => {
  return (
    <PublicLayout>
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden py-24 md:py-36 border-b border-border">
        {/* Shared ambient glow token */}
        <div className="ambient-glow" />

        <div className="max-w-5xl mx-auto px-6 text-center space-y-10 relative z-10">
          <h1 className="font-display text-text-primary text-[2.75rem] md:text-[5.5rem] leading-[1.05] tracking-tight">
            Financial Clarity,
            <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-brand via-income to-brand-hover">
              Without the Clutter.
            </span>
          </h1>

          <p className="text-text-secondary text-body-lg md:text-mono-lg max-w-2xl mx-auto leading-relaxed">
            Import statements, automatically resolve accounts, and track your
            budgets with a strict, minimal aesthetic that lets your numbers
            shine.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Link
              to="/register"
              className="btn btn-primary btn-lg w-full sm:w-auto flex items-center gap-2 py-4 px-10 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
            >
              <span>Get Started Free</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to="/pricing"
              className="btn btn-secondary btn-lg w-full sm:w-auto py-4 px-10 backdrop-blur-md bg-bg-surface/30 transition-all duration-300 hover:bg-bg-surface/70"
            >
              Explore Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* 1.5 Why BudgetSetu? Section */}
      <section className="py-24 md:py-32 bg-bg-surface/20 border-b border-border relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="font-display text-text-primary text-[2.25rem] md:text-[3.5rem] tracking-tight leading-tight">
                Why build another finance app?
              </h2>
              <div className="space-y-6 text-text-secondary text-body-lg leading-relaxed">
                <p>
                  Most people today juggle multiple bank accounts and rely on
                  various UPI apps like PhonePe, Google Pay, and Paytm for daily
                  transactions.
                </p>
                <p>
                  Tracking expenses across this fragmented ecosystem manually is
                  tedious and error-prone. You end up paying for a subscription
                  from one account, groceries from another, and splitting bills
                  on a third.
                </p>
                <p className="font-medium text-text-primary">
                  BudgetSetu was built to solve exactly this. By simply
                  uploading your standard bank statements, it unifies your
                  fragmented financial life into a single, automated dashboard
                  without requiring manual data entry for every single coffee or
                  cab ride.
                </p>
              </div>
            </div>
            <div className="relative hidden md:block">
              <div className="absolute inset-0 bg-linear-to-tr from-brand/20 to-income/20 blur-3xl opacity-50 rounded-full" />
              <div className="card backdrop-blur-md bg-bg-surface/40 border-border/80 p-8 relative z-10 space-y-6">
                <div className="flex items-center justify-between text-text-secondary">
                  <div className="space-y-3">
                    <div className="px-4 py-2 rounded-lg bg-bg-surface border border-border shadow-sm text-sm">
                      HDFC Bank
                    </div>
                    <div className="px-4 py-2 rounded-lg bg-bg-surface border border-border shadow-sm text-sm">
                      ICICI Bank
                    </div>
                    <div className="px-4 py-2 rounded-lg bg-bg-surface border border-border shadow-sm text-sm">
                      SBI Bank
                    </div>
                  </div>
                  <ArrowRight className="h-6 w-6 text-brand" />
                  <div className="space-y-3 text-right">
                    <div className="px-4 py-2 rounded-lg bg-bg-surface border border-border shadow-sm text-sm">
                      PhonePe
                    </div>
                    <div className="px-4 py-2 rounded-lg bg-bg-surface border border-border shadow-sm text-sm">
                      Google Pay
                    </div>
                    <div className="px-4 py-2 rounded-lg bg-bg-surface border border-border shadow-sm text-sm">
                      Paytm
                    </div>
                  </div>
                  <ArrowRight className="h-6 w-6 text-brand" />
                  <div className="px-6 py-8 rounded-xl bg-brand text-bg-base font-display text-xl text-center shadow-lg shadow-brand/20 leading-tight">
                    Budget
                    <br />
                    Setu
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Key Features Grid */}
      <section
        id="features"
        className="py-24 md:py-32 max-w-7xl mx-auto px-6 border-b border-border"
      >
        <div className="text-center space-y-4 mb-20">
          <h2 className="font-display text-text-primary text-[2.25rem] md:text-[3.5rem] tracking-tight">
            Engineered for Precision
          </h2>
          <p className="text-text-secondary text-body-md max-w-xl mx-auto leading-relaxed">
            Everything you need to audit, organize, and plan your cashflow
            without ad-banners, credit cards, or tracking.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="card backdrop-blur-md bg-bg-surface/40 border-border/80 p-8 space-y-5 transition-all duration-300 hover:-translate-y-2 hover:border-brand/40 hover:shadow-lg">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-brand-subtle text-brand flex items-center justify-center shadow-sm shrink-0">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="font-display text-text-primary text-heading-lg">
                Statement Parsing
              </h3>
            </div>
            <p className="text-text-secondary text-body-sm leading-relaxed">
              Drag-and-drop bank PDFs/CSVs. BudgetSetu auto-discovers bank
              details, parses data in seconds, and natively prompts you to
              unlock password-protected statement PDFs securely.
            </p>
            <div className="pt-2 border-t border-border/50">
              <p className="text-text-secondary text-[0.6875rem] font-medium tracking-wide uppercase">
                Supported Integrations:
              </p>
              <p className="text-text-secondary text-body-sm mt-1">
                PhonePe, Google Pay, Paytm, BHIM UPI, HDFC, ICICI, SBI, PNB,
                BoB, Central Bank, Indian Bank, Jio Payments Bank
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="card backdrop-blur-md bg-bg-surface/40 border-border/80 p-8 space-y-5 transition-all duration-300 hover:-translate-y-2 hover:border-brand/40 hover:shadow-lg">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-brand-subtle text-brand flex items-center justify-center shadow-sm shrink-0">
                <RefreshCw className="h-6 w-6" />
              </div>
              <h3 className="font-display text-text-primary text-heading-lg">
                Auto Cash &amp; Accounts
              </h3>
            </div>
            <p className="text-text-secondary text-body-sm leading-relaxed">
              Sign up and immediately receive a default Cash Wallet account to
              log manual spending. The system dynamically creates or resolves
              bank accounts on upload to keep logs organized.
            </p>
          </div>

          {/* Card 3 */}
          <div className="card backdrop-blur-md bg-bg-surface/40 border-border/80 p-8 space-y-5 transition-all duration-300 hover:-translate-y-2 hover:border-brand/40 hover:shadow-lg">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-brand-subtle text-brand flex items-center justify-center shadow-sm shrink-0">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="font-display text-text-primary text-heading-lg">
                Secure Calculations
              </h3>
            </div>
            <p className="text-text-secondary text-body-sm leading-relaxed">
              Dynamically calculates current balances, prioritizing statement
              closing balances or manual starting balances on dates you specify.
              Protected by strict, authenticated access controls at the
              application layer.
            </p>
          </div>
        </div>
      </section>

      {/* 3. How It Works Section */}
      <section className="py-24 md:py-32 bg-bg-surface/40 border-b border-border relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-4 mb-20">
            <h2 className="font-display text-text-primary text-[2.25rem] md:text-[3.5rem] tracking-tight">
              Simple 3-Step Flow
            </h2>
            <p className="text-text-secondary text-body-md max-w-xl mx-auto leading-relaxed">
              How BudgetSetu processes and presents your transaction statements
              securely.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Step 1 */}
            <div className="card backdrop-blur-md bg-bg-surface/30 p-8 space-y-5 transition-all duration-300 hover:scale-[1.02]">
              <div className="text-[3.5rem] font-display text-brand/35 leading-none">
                01
              </div>
              <h3 className="text-text-primary text-heading-md font-semibold">
                Upload Statement
              </h3>
              <p className="text-text-secondary text-body-sm leading-relaxed">
                Upload your bank statement. Files are encrypted immediately upon
                receipt using a key that is not accessible to our system
                administrators, and are permanently auto-deleted within 24
                hours.
              </p>
            </div>

            {/* Step 2 */}
            <div className="card backdrop-blur-md bg-bg-surface/30 p-8 space-y-5 transition-all duration-300 hover:scale-[1.02]">
              <div className="text-[3.5rem] font-display text-brand/35 leading-none">
                02
              </div>
              <h3 className="text-text-primary text-heading-md font-semibold">
                Auto-Classification
              </h3>
              <p className="text-text-secondary text-body-sm leading-relaxed">
                The parser extracts details, computes cryptographic fingerprints
                to skip duplicates, and tags categories automatically using
                standard or custom overrides.
              </p>
            </div>

            {/* Step 3 */}
            <div className="card backdrop-blur-md bg-bg-surface/30 p-8 space-y-5 transition-all duration-300 hover:scale-[1.02]">
              <div className="text-[3.5rem] font-display text-brand/35 leading-none">
                03
              </div>
              <h3 className="text-text-primary text-heading-md font-semibold">
                Monitor Cashflow
              </h3>
              <p className="text-text-secondary text-body-sm leading-relaxed">
                Monitor dashboard analytics, review budgets, fund savings
                targets, track physical currency via Cash Wallet, and export
                monthly summaries.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3.5 Security, Privacy & Deletion */}
      <section className="py-24 md:py-32 max-w-7xl mx-auto px-6 border-b border-border">
        <div className="text-center space-y-4 mb-20">
          <h2 className="font-display text-text-primary text-[2.25rem] md:text-[3.5rem] tracking-tight">
            Your Data is Yours. Period.
          </h2>
          <p className="text-text-secondary text-body-md max-w-xl mx-auto leading-relaxed">
            We built BudgetSetu with a strict, privacy-first architecture
            because financial data demands the highest level of respect.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="card backdrop-blur-md bg-bg-surface/40 border-border/80 p-8 space-y-5 transition-all duration-300 hover:-translate-y-2 hover:border-brand/40 hover:shadow-lg">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-expense/10 text-expense flex items-center justify-center shadow-sm shrink-0">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="font-display text-text-primary text-heading-lg">
                Data Security
              </h3>
            </div>
            <p className="text-text-secondary text-body-sm leading-relaxed">
              All database data is encrypted at rest using industry-standard
              AES-256 encryption. Access is enforced through authenticated,
              token-based authorization at the application layer, ensuring your
              data is logically isolated from other users.
            </p>
          </div>

          <div className="card backdrop-blur-md bg-bg-surface/40 border-border/80 p-8 space-y-5 transition-all duration-300 hover:-translate-y-2 hover:border-brand/40 hover:shadow-lg">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-brand/10 text-brand flex items-center justify-center shadow-sm shrink-0">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="font-display text-text-primary text-heading-lg">
                Strict Privacy Policy
              </h3>
            </div>
            <p className="text-text-secondary text-body-sm leading-relaxed">
              We do not sell your data to third parties. We do not use
              advertising networks or trackers. This application exists solely
              to serve you as a personal finance tool, not as a data-harvesting
              engine.
            </p>
          </div>

          <div className="card backdrop-blur-md bg-bg-surface/40 border-border/80 p-8 space-y-5 transition-all duration-300 hover:-translate-y-2 hover:border-brand/40 hover:shadow-lg">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-income/10 text-income flex items-center justify-center shadow-sm shrink-0">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="font-display text-text-primary text-heading-lg">
                1-Click Deletion
              </h3>
            </div>
            <p className="text-text-secondary text-body-sm leading-relaxed">
              Uploaded bank statements are permanently auto-deleted from the
              server within 24 hours. Furthermore, you have a one-click option
              in your settings to instantly and permanently wipe your entire
              account and all associated data.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Final CTA */}
      <section className="py-24 md:py-32 text-center max-w-4xl mx-auto px-6 relative overflow-hidden">
        <div className="space-y-8">
          <h2 className="font-display text-text-primary text-[2.25rem] md:text-[3.5rem] tracking-tight leading-tight">
            Take Control of Your Financial Narrative
          </h2>
          <p className="text-text-secondary text-body-lg max-w-xl mx-auto leading-relaxed">
            Create an account in less than a minute. No credit cards needed, no
            onboarding queues.
          </p>
          <div className="pt-4">
            <Link
              to="/register"
              className="btn btn-primary btn-lg flex items-center gap-2 mx-auto w-fit transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
            >
              <span>Sign Up Now</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};
