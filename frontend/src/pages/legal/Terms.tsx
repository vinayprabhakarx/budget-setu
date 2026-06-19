import React from 'react';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { ShieldAlert } from 'lucide-react';

export const Terms: React.FC = () => {
  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-6 py-16 md:py-24 space-y-12">
        {/* Header */}
        <div className="space-y-3 border-b border-border pb-6">
          <h1 className="font-display text-text-primary text-[2.5rem] md:text-[3.5rem] tracking-tight">
            Terms of Service
          </h1>
          <p className="text-text-secondary text-body-sm">
            Last Updated: June 11, 2026
          </p>
        </div>

        {/* Introduction */}
        <div className="text-text-secondary text-body-md leading-relaxed space-y-4">
          <p>
            Welcome to BudgetSetu. These Terms of Service ("Terms") govern your access to and use of the BudgetSetu website, applications, APIs, and associated statement parsing tools.
          </p>
          <p>
            By creating an account, uploading files, or interacting with the service, you agree to be bound by these Terms. If you do not agree, please do not use the application.
          </p>
        </div>

        {/* 1. Account Creation */}
        <section className="space-y-4">
          <h2 className="font-display text-text-primary text-heading-lg tracking-tight">
            1. User Registration & Security
          </h2>
          <div className="text-text-secondary text-body-md space-y-3 leading-relaxed">
            <p>
              To access BudgetSetu, you must create an account with a valid email address and a strong password. You are responsible for:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Maintaining the confidentiality of your session and password.</li>
              <li>Restricting access to devices holding your active session credentials.</li>
              <li>Notifying us immediately of any unauthorized access or breach of credentials.</li>
            </ul>
            <p>
              BudgetSetu is not liable for any losses caused by unauthorized use of your credentials.
            </p>
          </div>
        </section>

        {/* 2. Permitted Use */}
        <section className="space-y-4">
          <h2 className="font-display text-text-primary text-heading-lg tracking-tight">
            2. Permitted Use & Upload Restrictions
          </h2>
          <div className="text-text-secondary text-body-md space-y-3 leading-relaxed">
            <p>
              You may upload PDF, CSV, or Excel statements matching the formats of HDFC Bank, ICICI Bank, SBI, PhonePe, and Google Pay. All uploaded files are end-to-end encrypted upon receipt and automatically deleted within 10 minutes. You represent and warrant that:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You own or have authorization to process the transaction statements uploaded.</li>
              <li>The files do not contain malware, corrupted data, or code designed to interfere with our servers.</li>
              <li>You will not use scraping tools, crawlers, or automated bots to stress-test or scrape the dashboards.</li>
            </ul>
          </div>
        </section>

        {/* 3. Financial Disclaimer */}
        <section className="space-y-4">
          <h2 className="font-display text-text-primary text-heading-lg tracking-tight flex items-center gap-2.5">
            <ShieldAlert className="h-6 w-6 text-brand" />
            <span>3. No Financial Advice & Disclaimers</span>
          </h2>
          <div className="text-text-secondary text-body-md space-y-4 leading-relaxed">
            <div className="card border-warning/20 bg-warning-bg/10 p-5">
              <p className="text-warning-text font-semibold text-body-md mb-2">
                Important Financial Notice
              </p>
              <p className="text-body-sm leading-relaxed">
                BudgetSetu is a record-keeping and data aggregation utility. <strong>We do not provide investment, tax, legal, or general financial advice</strong>. All statement parser calculations, budget percentages, and savings projections are provided as-is, strictly for educational and auditing purposes.
              </p>
            </div>
            <p>
              The accuracy of imported ledger summaries depends entirely on the layout integrity of your statement files. You must manually verify all calculated balances, tax categorizations, and statement records before executing financial transactions, submitting tax declarations, or making business decisions.
            </p>
          </div>
        </section>

        {/* 4. Limitation of Liability */}
        <section className="space-y-4">
          <h2 className="font-display text-text-primary text-heading-lg tracking-tight">
            4. Limitation of Liability
          </h2>
          <p className="text-text-secondary text-body-md leading-relaxed">
            BudgetSetu, its creator (Vinay Prabhakar), and associated developers shall not be liable for any indirect, incidental, special, consequential, or punitive damages—including loss of profits, investment losses, data corruption, or server downtime—arising from your use of the statement parser, dashboards, or email alerts.
          </p>
        </section>

        {/* 5. Governing Law */}
        <section className="space-y-4">
          <h2 className="font-display text-text-primary text-heading-lg tracking-tight">
            5. Governing Law
          </h2>
          <p className="text-text-secondary text-body-md leading-relaxed">
            These Terms are governed by and construed in accordance with the laws of India, without giving effect to conflict of laws principles. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the competent courts in India.
          </p>
        </section>
      </div>
    </PublicLayout>
  );
};
