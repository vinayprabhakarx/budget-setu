import React from 'react';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { Eye, ShieldCheck, HeartHandshake, Layers } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <PublicLayout>
      <div className="relative overflow-hidden">
        {/* Deep modern ambient glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[37.5rem] h-[37.5rem] bg-brand/5 blur-[7.5rem] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28 space-y-20 relative z-10">
          {/* Header */}
          <div className="text-center space-y-6">
            <h1 className="font-display text-text-primary text-[2.75rem] md:text-[4rem] tracking-tight">
              About BudgetSetu
            </h1>

            <p className="text-text-secondary text-body-lg max-w-xl mx-auto leading-relaxed">
              The story, design principles, and mission behind a clean, tracker-free financial utility.
            </p>
          </div>

          {/* Story Section */}
          <section className="max-w-3xl mx-auto card backdrop-blur-md bg-bg-surface/40 border-border/80 p-8 md:p-12 space-y-6 shadow-sm hover:border-brand/40 transition-all duration-300 hover:shadow-lg">
            <h2 className="font-display text-text-primary text-[1.75rem] md:text-[2.25rem] tracking-tight border-b border-border pb-4">
              Why We Built BudgetSetu
            </h2>
            <div className="text-text-secondary text-body-md space-y-5 leading-relaxed">
              <p>
                BudgetSetu was created out of simple frustration. Most modern personal finance tools are cluttered with ad banners, aggressive credit card offers, and complex onboarding screens designed to lock users into commercial ecosystems. Worse, they demand access to live bank accounts, mining sensitive transaction data to sell targeted advertisements.
              </p>
              <p>
                We believed there was a better way: a tool that is fast, looks beautiful, runs completely on your own terms, and requires no permanent linking to live banking APIs.
              </p>
              <p>
                BudgetSetu offers cashflow clarity via secure, asynchronous statement imports. You drag and drop your standard bank PDF, CSV, XLS, or HTML statement, and the system extracts, deduplicates, and files the transactions in seconds. By supporting physical transaction tracking with an auto-initialized <strong>Cash Wallet</strong>, allowing secure synchronous decryption of <strong>password-protected statements</strong>, and calculating <strong>multi-priority balances</strong>, BudgetSetu provides a complete, modern ledger you own completely.
              </p>
            </div>
          </section>

          {/* Design Pillars */}
          <section className="space-y-10">
            <h2 className="font-display text-text-primary text-[1.75rem] md:text-[2.25rem] tracking-tight text-center">
              Our Core Pillars
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="card backdrop-blur-md bg-bg-surface/40 border-border/80 p-8 space-y-4 hover:-translate-y-1 hover:border-brand/40 hover:shadow-lg transition-all duration-300">
                <div className="h-10 w-10 rounded-md bg-brand-subtle text-brand flex items-center justify-center shadow-sm">
                  <Layers className="h-5 w-5" />
                </div>
                <h3 className="font-display text-text-primary text-heading-lg">Monochrome First</h3>
                <p className="text-text-secondary text-body-sm leading-relaxed">
                  We believe financial data is noisy enough on its own. BudgetSetu uses a strict monochrome-based layout where color carries meaning—green for income, red for expenses, amber for budget caps—rather than decoration.
                </p>
              </div>

              <div className="card backdrop-blur-md bg-bg-surface/40 border-border/80 p-8 space-y-4 hover:-translate-y-1 hover:border-brand/40 hover:shadow-lg transition-all duration-300">
                <div className="h-10 w-10 rounded-md bg-brand-subtle text-brand flex items-center justify-center shadow-sm">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="font-display text-text-primary text-heading-lg">Strict Isolation & E2E Encryption</h3>
                <p className="text-text-secondary text-body-sm leading-relaxed">
                  Your data is strictly yours. Behind the UI, PostgreSQL Row-Level Security (RLS) policies safeguard every query. When you upload a statement, it is secured with ephemeral AES-256 end-to-end encryption (meaning even we cannot read your files) and auto-deleted within 10 minutes.
                </p>
              </div>

              <div className="card backdrop-blur-md bg-bg-surface/40 border-border/80 p-8 space-y-4 hover:-translate-y-1 hover:border-brand/40 hover:shadow-lg transition-all duration-300">
                <div className="h-10 w-10 rounded-md bg-brand-subtle text-brand flex items-center justify-center shadow-sm">
                  <Eye className="h-5 w-5" />
                </div>
                <h3 className="font-display text-text-primary text-heading-lg">Zero Third-Party Trackers</h3>
                <p className="text-text-secondary text-body-sm leading-relaxed">
                  We do not include Google Analytics, Facebook SDKs, or Hotjar scripts. We don't want to track your clicks or watch your cursor. Your session is private, and we collect only what is necessary to run your account.
                </p>
              </div>

              <div className="card backdrop-blur-md bg-bg-surface/40 border-border/80 p-8 space-y-4 hover:-translate-y-1 hover:border-brand/40 hover:shadow-lg transition-all duration-300">
                <div className="h-10 w-10 rounded-md bg-brand-subtle text-brand flex items-center justify-center shadow-sm">
                  <HeartHandshake className="h-5 w-5" />
                </div>
                <h3 className="font-display text-text-primary text-heading-lg">Open Utility</h3>
                <p className="text-text-secondary text-body-sm leading-relaxed">
                  BudgetSetu is a community-first utility. By making it free to use, we set a new standard for developer transparency and public finance software.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
};
