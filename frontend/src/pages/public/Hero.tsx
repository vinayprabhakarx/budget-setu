import React from "react";
import { Link } from "react-router-dom";
import { PublicLayout } from "../../components/layout/PublicLayout";
import { 
  Shield, 
  FileText, 
  ArrowRight, 
  RefreshCw, 
  PieChart, 
  Activity, 
  CheckCircle2, 
  UploadCloud 
} from "lucide-react";

export const Hero: React.FC = () => {
  return (
    <PublicLayout>
      {/* 1. Hero Section (Split Layout + App Mockup) */}
      <section className="relative overflow-hidden py-24 md:py-32 border-b border-border">
        {/* Animated background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-200 bg-brand/20 blur-3xl rounded-full opacity-50 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Column: Typography */}
            <div className="space-y-8 text-center lg:text-left">
              <h1 className="font-display text-text-primary text-hero-xl leading-tight tracking-tight">
                Financial Clarity,
                <br />
                <span className="text-brand">
                  Without the Clutter.
                </span>
              </h1>

              <p className="text-text-secondary text-body-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Import statements, automatically resolve accounts, and track your
                budgets with a strict, minimal aesthetic that lets your numbers
                shine.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                <Link
                  to="/register"
                  className="btn btn-primary btn-lg w-full sm:w-auto flex items-center justify-center gap-2 py-4 px-8"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  to="/pricing"
                  className="btn btn-secondary btn-lg w-full sm:w-auto py-4 px-8"
                >
                  Explore Pricing
                </Link>
              </div>
            </div>

            {/* Right Column: CSS App Mockup */}
            <div className="relative hidden lg:block">
              <div className="absolute -inset-4 bg-brand/15 blur-2xl rounded-full opacity-50" />
              <div className="card bg-bg-surface/80 backdrop-blur-md border border-border/80 p-6 rounded-2xl shadow-2xl relative z-10">
                {/* Mockup Header */}
                <div className="flex justify-between items-center mb-8 border-b border-border/50 pb-4">
                  <div className="space-y-1">
                    <div className="h-4 w-24 bg-border rounded-full" />
                    <div className="h-8 w-40 bg-text-primary/20 rounded-full" />
                  </div>
                  <div className="h-10 w-10 bg-brand-subtle rounded-full flex items-center justify-center">
                    <PieChart className="h-5 w-5 text-brand" />
                  </div>
                </div>
                
                {/* Mockup Chart Area */}
                <div className="h-32 w-full flex items-end gap-2 mb-8">
                  {[40, 70, 45, 90, 65, 80, 55, 100].map((height, i) => (
                    <div 
                      key={i} 
                      className={`flex-1 rounded-t-sm ${i === 7 ? 'bg-brand' : 'bg-border/60'}`} 
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>

                {/* Mockup Transactions */}
                <div className="space-y-3">
                  {[
                    { title: "Salary", amt: "+₹85,000", color: "text-success", bg: "bg-success/10" },
                    { title: "Rent", amt: "-₹25,000", color: "text-text-primary", bg: "bg-border/50" },
                    { title: "Groceries", amt: "-₹4,500", color: "text-text-primary", bg: "bg-border/50" },
                  ].map((row, i) => (
                    <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-bg-base/50 border border-border/40">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full ${row.bg}`} />
                        <div className="h-3 w-20 bg-text-secondary/40 rounded-full" />
                      </div>
                      <div className={`text-sm font-mono font-medium ${row.color}`}>
                        {row.amt}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Key Features (Bento Grid Layout) */}
      <section id="features" className="py-24 md:py-32 bg-bg-surface/20 border-b border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16 max-w-2xl">
            <h2 className="font-display text-text-primary text-hero-sm tracking-tight mb-4">
              Engineered for Precision
            </h2>
            <p className="text-text-secondary text-body-lg">
              Everything you need to audit, organize, and plan your cashflow
              without the noise of traditional finance apps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Bento Block 1 (Large) */}
            <div className="md:col-span-2 md:row-span-2 card bg-bg-surface border-border p-8 flex flex-col">
              <div className="h-12 w-12 rounded-xl bg-brand-subtle text-brand flex items-center justify-center mb-6">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="font-display text-text-primary text-2xl mb-3">
                Statement Parsing
              </h3>
              <p className="text-text-secondary text-body-md mb-8 grow">
                Drag-and-drop bank PDFs or CSVs. BudgetSetu auto-discovers bank
                details, parses data in seconds, and handles password-protected
                statements securely locally.
              </p>
              
              {/* Abstract Visual for Parsing */}
              <div className="mt-auto p-4 rounded-xl border border-border/50 bg-bg-base flex flex-col gap-3">
                <div className="flex items-center justify-between opacity-50">
                  <div className="h-2 w-1/3 bg-text-primary/30 rounded-full" />
                  <div className="h-2 w-16 bg-brand rounded-full" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-2 w-1/2 bg-text-primary/50 rounded-full" />
                  <div className="h-2 w-20 bg-success rounded-full" />
                </div>
                <div className="flex items-center justify-between opacity-50">
                  <div className="h-2 w-1/4 bg-text-primary/30 rounded-full" />
                  <div className="h-2 w-12 bg-destructive rounded-full" />
                </div>
              </div>
            </div>

            {/* Bento Block 2 (Wide) */}
            <div className="md:col-span-2 card bg-bg-surface border-border p-8">
              <div className="flex justify-between items-start mb-4">
                <div className="h-10 w-10 rounded-xl bg-brand-subtle text-brand flex items-center justify-center">
                  <RefreshCw className="h-5 w-5" />
                </div>
              </div>
              <h3 className="font-display text-text-primary text-xl mb-2">
                Auto Cash &amp; Accounts
              </h3>
              <p className="text-text-secondary text-body-sm">
                The system dynamically resolves bank accounts on upload to keep your logs perfectly organized.
              </p>
            </div>

            {/* Bento Block 3 (Wide) */}
            <div className="md:col-span-2 card bg-bg-surface border-border p-8">
              <div className="flex justify-between items-start mb-4">
                <div className="h-10 w-10 rounded-xl bg-brand-subtle text-brand flex items-center justify-center">
                  <Shield className="h-5 w-5" />
                </div>
              </div>
              <h3 className="font-display text-text-primary text-xl mb-2">
                Secure Calculations
              </h3>
              <p className="text-text-secondary text-body-sm">
                Dynamically calculates balances, prioritizing statement closing
                balances or manual overrides. Protected by strict, token-based access controls.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. How It Works (Alternating Storytelling Layout) */}
      <section className="py-24 md:py-32 border-b border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-24">
            <h2 className="font-display text-text-primary text-hero-md tracking-tight mb-4">
              How it Works
            </h2>
            <p className="text-text-secondary text-body-lg max-w-2xl mx-auto">
              A simple, secure three-step pipeline to transform your financial chaos into clarity.
            </p>
          </div>

          <div className="space-y-32">
            {/* Step 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="font-display text-brand text-5xl font-bold opacity-30">01</div>
                <h3 className="font-display text-text-primary text-3xl">Upload Statement</h3>
                <p className="text-text-secondary text-body-lg leading-relaxed">
                  Simply drag and drop your bank statements. We securely accept standard PDF 
                  and CSV formats from over 12 major Indian banks and UPI apps. Your files 
                  are parsed instantly in memory.
                </p>
              </div>
              <div className="card bg-bg-surface border-border p-12 flex items-center justify-center border-dashed">
                <div className="text-center space-y-4">
                  <div className="mx-auto h-16 w-16 bg-brand-subtle rounded-full flex items-center justify-center text-brand">
                    <UploadCloud className="h-8 w-8" />
                  </div>
                  <div className="font-medium text-text-primary">Drop statement here</div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="card bg-bg-surface border-border p-8 md:order-1 order-2">
                {/* Visual for parsing/classification */}
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-3 border border-border/50 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                      <div className="h-2 w-32 bg-text-primary/20 rounded-full" />
                      <div className="ml-auto h-6 w-16 bg-brand-subtle text-brand text-xs font-mono rounded flex items-center justify-center">
                        TAGGED
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-6 md:order-2 order-1">
                <div className="font-display text-brand text-5xl font-bold opacity-30">02</div>
                <h3 className="font-display text-text-primary text-3xl">Auto-Classification</h3>
                <p className="text-text-secondary text-body-lg leading-relaxed">
                  Our local parser extracts transaction details, computes cryptographic fingerprints 
                  to skip duplicates, and automatically tags categories using smart rules and your 
                  custom overrides.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="font-display text-brand text-5xl font-bold opacity-30">03</div>
                <h3 className="font-display text-text-primary text-3xl">Monitor Cashflow</h3>
                <p className="text-text-secondary text-body-lg leading-relaxed">
                  Dive into your clean dashboard. Review analytics, manage budget caps, 
                  and monitor your exact net worth across all fragmented accounts in one 
                  unified ledger.
                </p>
              </div>
              <div className="card bg-bg-surface border-border p-8">
                {/* Visual for dashboard metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border border-border/50 rounded-lg bg-bg-base space-y-2">
                    <div className="text-xs text-text-muted">Total Income</div>
                    <div className="text-lg font-mono text-success">₹ 1,24,000</div>
                  </div>
                  <div className="p-4 border border-border/50 rounded-lg bg-bg-base space-y-2">
                    <div className="text-xs text-text-muted">Total Expense</div>
                    <div className="text-lg font-mono text-destructive">₹ 42,500</div>
                  </div>
                  <div className="col-span-2 p-4 border border-border/50 rounded-lg bg-bg-base mt-2">
                    <div className="flex items-center gap-2 text-brand">
                      <Activity className="h-5 w-5" />
                      <span className="font-medium">Cashflow is healthy</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};
