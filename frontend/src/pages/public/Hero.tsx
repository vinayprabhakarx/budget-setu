import React from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { Shield, FileText, ArrowRight, RefreshCw } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <PublicLayout>
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden py-24 md:py-36 border-b border-border">
        {/* Deep modern ambient glows */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-brand/10 blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-income/10 blur-[120px] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--color-brand-subtle),transparent_60%)] opacity-60 pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6 text-center space-y-10 relative z-10">
          <h1 className="font-display text-text-primary text-[2.75rem] md:text-[5.5rem] leading-[1.05] tracking-tight">
            Financial Clarity,<br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-brand via-income to-brand-hover">Without the Clutter.</span>
          </h1>

          <p className="text-text-secondary text-body-lg md:text-mono-lg max-w-2xl mx-auto leading-relaxed">
            Import statements, automatically resolve accounts, and track your budgets with a strict, minimal aesthetic that lets your numbers shine.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Link to="/login" className="btn btn-primary btn-lg w-full sm:w-auto flex items-center gap-2 py-4 px-10 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]">
              <span>Get Started Free</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link to="/pricing" className="btn btn-secondary btn-lg w-full sm:w-auto py-4 px-10 backdrop-blur-md bg-bg-surface/30 transition-all duration-300 hover:bg-bg-surface/70">
              Explore Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Key Features Grid */}
      <section id="features" className="py-24 md:py-32 max-w-7xl mx-auto px-6 border-b border-border">
        <div className="text-center space-y-4 mb-20">
          <h2 className="font-display text-text-primary text-[2.25rem] md:text-[3.5rem] tracking-tight">
            Engineered for Precision
          </h2>
          <p className="text-text-secondary text-body-md max-w-xl mx-auto leading-relaxed">
            Everything you need to audit, organize, and plan your cashflow without ad-banners, credit cards, or tracking.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="card backdrop-blur-md bg-bg-surface/40 border-border/80 p-8 space-y-5 transition-all duration-300 hover:-translate-y-2 hover:border-brand/40 hover:shadow-lg">
            <div className="h-12 w-12 rounded-lg bg-brand-subtle text-brand flex items-center justify-center shadow-sm">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="font-display text-text-primary text-heading-lg">Statement Parsing</h3>
            <p className="text-text-secondary text-body-sm leading-relaxed">
              Drag-and-drop bank PDFs/CSVs. BudgetSetu auto-discovers bank details, parses data in seconds, and natively prompts you to unlock password-protected statement PDFs securely.
            </p>
            <div className="pt-2 border-t border-border/50">
              <p className="text-text-secondary text-[11px] font-medium tracking-wide uppercase">Supported Integrations:</p>
              <p className="text-text-secondary text-body-sm mt-1">PhonePe, Google Pay, Paytm, BHIM UPI, HDFC, ICICI, SBI, PNB, BoB, Central Bank, Indian Bank, Jio Payments Bank</p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="card backdrop-blur-md bg-bg-surface/40 border-border/80 p-8 space-y-5 transition-all duration-300 hover:-translate-y-2 hover:border-brand/40 hover:shadow-lg">
            <div className="h-12 w-12 rounded-lg bg-brand-subtle text-brand flex items-center justify-center shadow-sm">
              <RefreshCw className="h-6 w-6" />
            </div>
            <h3 className="font-display text-text-primary text-heading-lg">Auto Cash & Accounts</h3>
            <p className="text-text-secondary text-body-sm leading-relaxed">
              Sign up and immediately receive a default Cash Wallet account to log manual spending. The system dynamically creates or resolves bank accounts on upload to keep logs organized.
            </p>
          </div>

          {/* Card 3 */}
          <div className="card backdrop-blur-md bg-bg-surface/40 border-border/80 p-8 space-y-5 transition-all duration-300 hover:-translate-y-2 hover:border-brand/40 hover:shadow-lg">
            <div className="h-12 w-12 rounded-lg bg-brand-subtle text-brand flex items-center justify-center shadow-sm">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="font-display text-text-primary text-heading-lg">Secure Calculations</h3>
            <p className="text-text-secondary text-body-sm leading-relaxed">
              Dynamically calculates current balances, prioritizing statement closing balances or manual starting balances on dates you specify. Protected under strict database RLS policies.
            </p>
          </div>
        </div>
      </section>

      {/* 3. How It Works Section */}
      <section className="py-24 md:py-32 bg-bg-surface/40 border-b border-border relative overflow-hidden">
        <div className="absolute top-1/2 right-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-brand/5 blur-[100px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-4 mb-20">
            <h2 className="font-display text-text-primary text-[2.25rem] md:text-[3.5rem] tracking-tight">
              Simple 3-Step Flow
            </h2>
            <p className="text-text-secondary text-body-md max-w-xl mx-auto leading-relaxed">
              How BudgetSetu processes and presents your transaction statements securely.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Step 1 */}
            <div className="card backdrop-blur-md bg-bg-surface/30 p-8 space-y-5 transition-all duration-300 hover:scale-[1.02]">
              <div className="text-[3.5rem] font-display text-brand/35 leading-none">01</div>
              <h3 className="text-text-primary text-heading-md font-semibold">Upload Statement</h3>
              <p className="text-text-secondary text-body-sm leading-relaxed">
                Upload your bank statement. Files are protected with ephemeral AES-256 end-to-end encryption. Even server admins cannot read them, and they are permanently auto-deleted after 10 minutes.
              </p>
            </div>

            {/* Step 2 */}
            <div className="card backdrop-blur-md bg-bg-surface/30 p-8 space-y-5 transition-all duration-300 hover:scale-[1.02]">
              <div className="text-[3.5rem] font-display text-brand/35 leading-none">02</div>
              <h3 className="text-text-primary text-heading-md font-semibold">Auto-Classification</h3>
              <p className="text-text-secondary text-body-sm leading-relaxed">
                The parser extracts details, computes cryptographic fingerprints to skip duplicates, and tags categories automatically using standard or custom overrides.
              </p>
            </div>

            {/* Step 3 */}
            <div className="card backdrop-blur-md bg-bg-surface/30 p-8 space-y-5 transition-all duration-300 hover:scale-[1.02]">
              <div className="text-[3.5rem] font-display text-brand/35 leading-none">03</div>
              <h3 className="text-text-primary text-heading-md font-semibold">Monitor Cashflow</h3>
              <p className="text-text-secondary text-body-sm leading-relaxed">
                Monitor dashboard analytics, review budgets, fund savings targets, track physical currency via Cash Wallet, and export monthly summaries.
              </p>
            </div>
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
            Create an account in less than a minute. No credit cards needed, no onboarding queues.
          </p>
          <div className="pt-4">
            <Link to="/login" className="btn btn-primary btn-lg flex items-center gap-2 mx-auto w-fit transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]">
              <span>Sign Up Now</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};
