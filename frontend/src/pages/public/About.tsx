import React from "react";
import { PublicLayout } from "../../components/layout/PublicLayout";
import { Eye, ShieldCheck, HeartHandshake } from "lucide-react";

export const About: React.FC = () => {
  return (
    <PublicLayout>
      <div className="relative overflow-hidden py-24 md:py-32">
        {/* Animated ambient glow */}
        <div className="ambient-glow-animated" />

        <div className="max-w-7xl mx-auto px-6 relative z-10 space-y-32">
          
          {/* Header & Manifesto */}
          <section className="max-w-3xl mx-auto text-center space-y-8">
            <h1 className="font-display text-text-primary text-[3rem] md:text-[4.5rem] leading-[1.05] tracking-tight">
              Privacy is <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-brand to-brand-hover">
                Not a Luxury.
              </span>
            </h1>
            <div className="text-text-secondary text-body-lg space-y-6 leading-relaxed">
              <p>
                BudgetSetu was created to solve a very specific modern
                frustration: financial fragmentation. Today, an average person
                juggles multiple bank accounts and bounces between various UPI
                apps like PhonePe, Google Pay, and Paytm just to get through the
                day.
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
            </div>
          </section>

          {/* Design Pillars (Masonry Bento Grid) */}
          <section className="space-y-12">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="font-display text-text-primary text-[2.25rem] md:text-[3.5rem] tracking-tight mb-4">
                Our Core Pillars
              </h2>
              <p className="text-text-secondary text-body-lg">
                The strict engineering principles that govern every line of code we ship.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
              
              {/* Main Pillar: Spans 4 cols */}
              <div className="md:col-span-4 card bg-bg-surface/40 backdrop-blur-xl border border-white/5 p-8 md:p-12 hover:-translate-y-2 transition-all duration-500 hover:bg-bg-surface/60 hover:shadow-2xl hover:shadow-brand/10 group">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-14 w-14 rounded-2xl bg-brand-subtle text-brand flex items-center justify-center shadow-sm shrink-0 transition-transform duration-500 group-hover:scale-110">
                    <ShieldCheck className="h-7 w-7" />
                  </div>
                  <h3 className="font-display text-text-primary text-3xl">
                    Security &amp; Privacy
                  </h3>
                </div>
                <p className="text-text-secondary text-body-lg leading-relaxed max-w-2xl">
                  Your data is strictly yours. Behind the UI, strict
                  authenticated, token-based access controls at the application
                  layer safeguard every request. When you upload a statement, it
                  is encrypted immediately upon receipt using a key that is not
                  accessible to our system administrators (meaning even we
                  cannot read your files), and it is auto-deleted.
                  Furthermore, you maintain complete control with a
                  1-click option to permanently wipe all your data.
                </p>
              </div>

              {/* Secondary Pillar: Spans 2 cols, taller */}
              <div className="md:col-span-2 card bg-bg-surface/40 backdrop-blur-xl border border-white/5 p-8 hover:-translate-y-2 transition-all duration-500 hover:bg-bg-surface/60 hover:shadow-2xl hover:shadow-brand/10 flex flex-col group">
                <div className="h-12 w-12 rounded-xl bg-brand-subtle text-brand flex items-center justify-center shadow-sm mb-6 transition-transform duration-500 group-hover:scale-110">
                  <Eye className="h-6 w-6" />
                </div>
                <h3 className="font-display text-text-primary text-2xl mb-4">
                  Zero Trackers
                </h3>
                <p className="text-text-secondary text-body-md leading-relaxed flex-grow">
                  We do not include Google Analytics, Facebook SDKs, or Hotjar
                  scripts. We don't want to track your clicks or watch your
                  cursor. Your session is private, and we collect only what is
                  necessary to run your account.
                </p>
              </div>

              {/* Third Pillar: Spans 6 cols, wide banner */}
              <div className="md:col-span-6 card bg-linear-to-r from-bg-surface/40 to-brand/5 backdrop-blur-xl border border-white/5 p-8 md:p-12 hover:-translate-y-2 transition-all duration-500 hover:shadow-2xl hover:shadow-brand/10 group flex flex-col md:flex-row items-center md:items-start gap-8 text-center md:text-left">
                <div className="h-16 w-16 rounded-2xl bg-brand text-bg-base flex items-center justify-center shadow-lg shrink-0 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                  <HeartHandshake className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="font-display text-text-primary text-3xl mb-3">
                    Open Utility
                  </h3>
                  <p className="text-text-secondary text-body-lg leading-relaxed max-w-4xl">
                    BudgetSetu is a community-first utility. By making it free to
                    use without paywalls or ads, we want to set a new standard for developer transparency and
                    public finance software.
                  </p>
                </div>
              </div>

            </div>
          </section>

        </div>
      </div>
    </PublicLayout>
  );
};
