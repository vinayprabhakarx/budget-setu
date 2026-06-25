import React from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { Check, Shield, Heart } from 'lucide-react';

export const Pricing: React.FC = () => {
  const freeFeatures = [
    'Unlimited statement imports (PDF, CSV, Excel, HTML)',
    'Synchronous decryption for password-protected statements',
    'Auto-initialized Cash Wallet for manual spending logs',
    'Dynamic multi-priority account balance calculations',
    'Custom merchant overrides & automated categorization',
    'Real-time budget tracking & daily alert triggers',
    'Relational bank account merging and reconciliation',
    'Exportable CSV & PDF financial summaries & reports',
  ];

  return (
    <PublicLayout>
      <div className="relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand/5 blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28 space-y-20 relative z-10">
          {/* Header */}
          <div className="text-center space-y-6">
            <h1 className="font-display text-text-primary text-[2.75rem] md:text-[4rem] tracking-tight">
              100% Free. For Everyone.
            </h1>
            <p className="text-text-secondary text-body-md max-w-xl mx-auto leading-relaxed">
              BudgetSetu is built as a public utility to help people achieve absolute cashflow clarity. No hidden subscriptions, no ads, no locks.
            </p>
          </div>

          {/* Big Free Banner Card */}
          <div className="max-w-3xl mx-auto card border-brand/50 bg-brand-subtle/10 backdrop-blur-md p-8 md:p-12 space-y-8 relative overflow-hidden transition-all duration-300 hover:border-brand hover:shadow-xl">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[radial-gradient(circle_at_center,var(--color-brand-muted),transparent_70%)] opacity-35" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-border/60">
              <div className="space-y-2">
                <h2 className="font-display text-text-primary text-heading-lg md:text-[1.75rem]">The Complete Suite</h2>
                <p className="text-text-secondary text-body-sm max-w-sm">
                  Get full access to all features with zero monetary or data collection costs.
                </p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-mono text-[4rem] font-semibold text-brand tracking-tight">₹0</span>
                <span className="text-text-secondary text-body-sm">/ forever</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {freeFeatures.map((feat) => (
                <div key={feat} className="flex items-start gap-3 text-body-sm text-text-secondary">
                  <Check className="h-5 w-5 text-brand shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            <div className="pt-6 flex flex-col sm:flex-row gap-4 items-center justify-between border-t border-border/60">
              <div className="flex items-center gap-2 text-text-secondary text-body-sm">
                <Shield className="h-4.5 w-4.5 text-brand shrink-0" />
                <span>No credit card required. Private data.</span>
              </div>
              <Link to="/login" className="btn btn-primary btn-md w-full sm:w-auto transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]">
                Create Free Account
              </Link>
            </div>
          </div>

          {/* Why Free Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto pt-6">
            <div className="card backdrop-blur-md bg-bg-surface/40 border-border/80 p-8 space-y-4 hover:-translate-y-1 hover:border-brand/40 hover:shadow-lg transition-all duration-300">
              <div className="h-10 w-10 rounded-md bg-brand-subtle text-brand flex items-center justify-center shadow-sm">
                <Heart className="h-5 w-5" />
              </div>
              <h3 className="font-display text-text-primary text-heading-lg">Open Source & Public Utility</h3>
              <p className="text-text-secondary text-body-sm leading-relaxed">
                We believe financial management should not be locked behind payment gateways or sold to advertisers. BudgetSetu was built to offer a clean, functional alternative to commercial, trackers-filled personal finance applications.
              </p>
            </div>

            <div className="card backdrop-blur-md bg-bg-surface/40 border-border/80 p-8 space-y-4 hover:-translate-y-1 hover:border-brand/40 hover:shadow-lg transition-all duration-300">
              <div className="h-10 w-10 rounded-md bg-brand-subtle text-brand flex items-center justify-center shadow-sm">
                <Shield className="h-5 w-5" />
              </div>
              <h3 className="font-display text-text-primary text-heading-lg">Strict Privacy Principles</h3>
              <p className="text-text-secondary text-body-sm leading-relaxed">
                Because BudgetSetu is free and does not monetize, we have no incentive to mine or sell your statement data. All data is processed securely and isolated per-user under strict database policies. You retain absolute ownership.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};
