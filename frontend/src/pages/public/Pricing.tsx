import React from "react";
import { Link } from "react-router-dom";
import { PublicLayout } from "../../components/layout/PublicLayout";
import { Check, Shield, ArrowRight, ScanLine, Heart } from "lucide-react";

export const Pricing: React.FC = () => {
  const freeFeatures = [
    "Unlimited statement imports (PDF, CSV, Excel)",
    "Local decryption for password-protected statements",
    "Dynamic multi-priority balance calculations",
    "Encrypted Backup and restore functionality",
    "Custom merchant overrides & auto-categorization",
    "Real-time budget tracking & daily alert triggers",
    "Relational bank account merging and reconciliation",
    "Exportable CSV & PDF financial summaries",
  ];

  return (
    <PublicLayout>
      <div className="relative overflow-hidden py-24 md:py-32">
        {/* Animated background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-200 bg-brand/20 blur-[7.5rem] rounded-full opacity-50 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10 space-y-20">
          {/* Header */}
          <div className="text-center space-y-6 max-w-2xl mx-auto">
            <h1 className="font-display text-text-primary text-[3rem] md:text-[4.5rem] leading-[1.05] tracking-tight">
              100% Free.
              <br />
              <span className="text-brand">For Everyone.</span>
            </h1>
            <p className="text-text-secondary text-body-lg leading-relaxed">
              BudgetSetu is built as a public utility to help people achieve
              absolute cashflow clarity. No hidden subscriptions, no ads, no
              paywalls.
            </p>
          </div>

          {/* Digital Pass Card */}
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(var(--color-brand),0.15)] bg-bg-surface/60 backdrop-blur-2xl border border-border/80 transition-transform duration-500 hover:scale-[1.02]">
              {/* Pass Left: The Ticket Stub */}
              <div className="md:w-1/3 bg-linear-to-br from-brand/10 to-transparent p-8 md:p-12 border-b md:border-b-0 md:border-r border-dashed border-border flex flex-col justify-between relative overflow-hidden">
                <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-bg-base rounded-full border-r border-dashed border-border" />

                <div>
                  <div className="flex items-center gap-2 text-brand font-mono text-sm tracking-widest uppercase mb-8">
                    <Shield className="h-4 w-4" />
                    Lifetime Access
                  </div>
                  <div className="space-y-1">
                    <div className="text-5xl font-display font-bold text-text-primary">
                      ₹0
                    </div>
                    <div className="text-text-secondary font-medium uppercase tracking-wider text-sm">
                      Forever
                    </div>
                  </div>
                </div>

                <div className="mt-12 flex flex-col items-center justify-center opacity-60">
                  <ScanLine className="h-16 w-16 text-text-primary/40 mb-2" />
                  <div className="font-mono text-xs tracking-[0.3em] text-text-muted">
                    BGT-STU-0001
                  </div>
                </div>
              </div>

              {/* Pass Right: Features */}
              <div className="md:w-2/3 p-8 md:p-12 relative">
                <div className="absolute -right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-bg-base rounded-full border-l border-dashed border-border hidden md:block" />

                <h2 className="font-display text-2xl text-text-primary mb-8">
                  Everything Included:
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                  {freeFeatures.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3 group">
                      <div className="h-6 w-6 rounded-full bg-success/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-success/20 transition-colors">
                        <Check className="h-3.5 w-3.5 text-success" />
                      </div>
                      <span className="text-text-secondary text-sm leading-relaxed group-hover:text-text-primary transition-colors">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-12 pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-brand-subtle flex items-center justify-center text-brand">
                      <Heart className="h-5 w-5" />
                    </div>
                    <p className="text-sm text-text-secondary font-medium">
                      Built with passion for the public.
                    </p>
                  </div>
                  <Link
                    to="/register"
                    className="btn btn-primary px-8 py-3 w-full sm:w-auto flex items-center justify-center gap-2 hover:scale-105 transition-transform"
                  >
                    <span>Claim Your Pass</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};
