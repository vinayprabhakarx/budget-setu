import React from "react";
import { PublicLayout } from "../../components/layout/PublicLayout";
import { Eye, ShieldCheck, HeartHandshake, Layers } from "lucide-react";

export const About: React.FC = () => {
  return (
    <PublicLayout>
      <div className="relative overflow-hidden">
        {/* Shared ambient glow token */}
        <div className="ambient-glow" />

        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28 space-y-20 relative z-10">
          {/* Header */}
          <div className="text-center space-y-6">
            <h1 className="font-display text-text-primary text-[2.75rem] md:text-[4rem] tracking-tight">
              About BudgetSetu
            </h1>

            <p className="text-text-secondary text-body-lg max-w-xl mx-auto leading-relaxed">
              The story, design principles, and mission behind a clean,
              tracker-free financial utility.
            </p>
          </div>

          {/* Story Section */}
          <section className="max-w-3xl mx-auto card backdrop-blur-md bg-bg-surface/40 border-border/80 p-8 md:p-12 space-y-6 shadow-sm hover:border-brand/40 transition-all duration-300 hover:shadow-lg">
            <h2 className="font-display text-text-primary text-[1.75rem] md:text-[2.25rem] tracking-tight border-b border-border pb-4">
              Why We Built BudgetSetu
            </h2>
            <div className="text-text-secondary text-body-md space-y-5 leading-relaxed">
              <p>
                BudgetSetu was created to solve a very specific modern
                frustration: financial fragmentation. Today, an average person
                juggles multiple bank accounts and bounces between various UPI
                apps like PhonePe, Google Pay, and Paytm just to get through the
                day.
              </p>
              <p>
                When you pay for groceries from one account, subscriptions from
                another, and split bills on a third, tracking your expenses
                manually becomes incredibly tedious. Manual transaction entry
                almost always leads to forgotten expenses and inaccurate
                budgets.
              </p>
              <p>
                Instead of demanding live access to your banking APIs and mining
                your sensitive data to sell targeted advertisements—like most
                commercial finance tools do—we built BudgetSetu. It unifies your
                cashflow simply through secure, asynchronous statement imports.
                You just drag and drop your standard bank PDF or CSV, and the
                system extracts, deduplicates, and files your transactions
                across all your accounts in seconds.
              </p>
              <p>
                With support for physical transaction tracking via an
                auto-initialized <strong>Cash Wallet</strong>, secure
                synchronous decryption of{" "}
                <strong>password-protected statements</strong>, and{" "}
                <strong>multi-priority balance</strong> calculations, BudgetSetu
                provides a complete, modern ledger that tames the chaos of
                multiple accounts.
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
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-md bg-brand-subtle text-brand flex items-center justify-center shadow-sm shrink-0">
                    <Layers className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-text-primary text-heading-lg">
                    Monochrome First
                  </h3>
                </div>
                <p className="text-text-secondary text-body-sm leading-relaxed">
                  We believe financial data is noisy enough on its own.
                  BudgetSetu uses a strict monochrome-based layout where color
                  carries meaning—green for income, red for expenses, amber for
                  budget caps—rather than decoration.
                </p>
              </div>

              <div className="card backdrop-blur-md bg-bg-surface/40 border-border/80 p-8 space-y-4 hover:-translate-y-1 hover:border-brand/40 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-md bg-brand-subtle text-brand flex items-center justify-center shadow-sm shrink-0">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-text-primary text-heading-lg">
                    Security, Privacy &amp; Deletion
                  </h3>
                </div>
                <p className="text-text-secondary text-body-sm leading-relaxed">
                  Your data is strictly yours. Behind the UI, strict
                  authenticated, token-based access controls at the application
                  layer safeguard every request. When you upload a statement, it
                  is encrypted immediately upon receipt using a key that is not
                  accessible to our system administrators (meaning even we
                  cannot read your files), and it is auto-deleted within 24
                  hours. Furthermore, you maintain complete control with a
                  1-click option to permanently wipe all your data.
                </p>
              </div>

              <div className="card backdrop-blur-md bg-bg-surface/40 border-border/80 p-8 space-y-4 hover:-translate-y-1 hover:border-brand/40 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-md bg-brand-subtle text-brand flex items-center justify-center shadow-sm shrink-0">
                    <Eye className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-text-primary text-heading-lg">
                    Zero Third-Party Trackers
                  </h3>
                </div>
                <p className="text-text-secondary text-body-sm leading-relaxed">
                  We do not include Google Analytics, Facebook SDKs, or Hotjar
                  scripts. We don't want to track your clicks or watch your
                  cursor. Your session is private, and we collect only what is
                  necessary to run your account.
                </p>
              </div>

              <div className="card backdrop-blur-md bg-bg-surface/40 border-border/80 p-8 space-y-4 hover:-translate-y-1 hover:border-brand/40 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-md bg-brand-subtle text-brand flex items-center justify-center shadow-sm shrink-0">
                    <HeartHandshake className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-text-primary text-heading-lg">
                    Open Utility
                  </h3>
                </div>
                <p className="text-text-secondary text-body-sm leading-relaxed">
                  BudgetSetu is a community-first utility. By making it free to
                  use, we set a new standard for developer transparency and
                  public finance software.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
};
