import React from 'react';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { Shield, Lock, Trash2 } from 'lucide-react';

export const Privacy: React.FC = () => {
  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-6 py-16 md:py-24 space-y-12">
        {/* Header */}
        <div className="space-y-3 border-b border-border pb-6">
          <h1 className="font-display text-text-primary text-[2.5rem] md:text-[3.5rem] tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-text-secondary text-body-sm">
            Last Updated: June 11, 2026
          </p>
        </div>

        {/* Introduction */}
        <div className="text-text-secondary text-body-md leading-relaxed space-y-4">
          <p>
            At BudgetSetu, we treat your financial and personal data with strict confidentiality. Since we do not sell advertisement space or monetize your personal transactions, we have <strong>zero incentive to trace, catalog, or share your financial records with third parties</strong>.
          </p>
          <p>
            This Privacy Policy details what data we collect, where it is stored, how it is safeguarded, and how you can exercise absolute control over it.
          </p>
        </div>

        {/* 1. What We Collect */}
        <section className="space-y-4">
          <h2 className="font-display text-text-primary text-heading-lg tracking-tight">
            1. Information We Collect
          </h2>
          <div className="text-text-secondary text-body-md space-y-3">
            <p>To operate the BudgetSetu financial suite, we collect the following records:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Account Credentials:</strong> Full name, email address, and encrypted password hashes. Passwords are salted and hashed using BCrypt before storing.
              </li>
              <li>
                <strong>Financial Account Profiles:</strong> Names, masked account numbers, bank names, and account balances which you manually initialize or import.
              </li>
              <li>
                <strong>Uploaded Statement Files:</strong> PDF, CSV, or Excel files containing transaction history from your bank or UPI statements.
              </li>
              <li>
                <strong>Transaction ledgers:</strong> Date, amount, normalized merchant descriptions, classification categories, note logs, and tags.
              </li>
              <li>
                <strong>Merchant Classification Rules:</strong> Custom regex and patterns you create to direct automated category tagging.
              </li>
            </ul>
          </div>
        </section>

        {/* 2. Data Storage & Security */}
        <section className="space-y-4">
          <h2 className="font-display text-text-primary text-heading-lg tracking-tight">
            2. Data Security & Storage Architecture
          </h2>
          <div className="text-text-secondary text-body-md space-y-4">
            <p>
              Your data is stored securely using an enterprise hybrid database architecture:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="card space-y-2.5">
                <Lock className="h-5 w-5 text-brand" />
                <h3 className="text-text-primary text-body-md font-semibold">Row-Level Isolation</h3>
                <p className="text-body-sm leading-relaxed">
                  Every SQL table (users, accounts, transactions, budgets, goals) is protected by <strong>PostgreSQL Row-Level Security (RLS)</strong>. Access is restricted at the database engine level based on the authenticated JWT token.
                </p>
              </div>

              <div className="card space-y-2.5">
                <Shield className="h-5 w-5 text-brand" />
                <h3 className="text-text-primary text-body-md font-semibold">End-to-End File Encryption</h3>
                <p className="text-body-sm leading-relaxed">
                  Uploaded statement files are secured with ephemeral AES-256 encryption using an in-memory key before being temporarily stored. Even our system administrators cannot read them. Once processed, these encrypted files are automatically and permanently deleted from our servers within 10 minutes.
                </p>
              </div>
            </div>
            <p>
              Metadata and logs are maintained in a secure MongoDB Atlas cluster, and temporary caches reside in an encrypted Redis instance. All database interactions utilize secure TLS/SSL handshakes.
            </p>
          </div>
        </section>

        {/* 3. Subprocessors */}
        <section className="space-y-4">
          <h2 className="font-display text-text-primary text-heading-lg tracking-tight">
            3. Third-Party Subprocessors
          </h2>
          <p className="text-text-secondary text-body-md leading-relaxed">
            We work with selected hosting and utility providers to offer our services. We do not sell your personal data to these companies:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-text-secondary text-body-md">
            <li><strong>Cloud Storage & Hosting:</strong> Secure cloud infrastructure, database clusters, and memory cache servers.</li>
            <li><strong>Mailgun:</strong> Transactional email processing (used to send welcome, password reset, and budget threshold alert emails).</li>
          </ul>
        </section>

        {/* 4. User Rights & Data Deletion */}
        <section className="space-y-4">
          <h2 className="font-display text-text-primary text-heading-lg tracking-tight">
            4. User Rights & Full Deletion
          </h2>
          <div className="text-text-secondary text-body-md space-y-4">
            <p>
              We believe in the absolute right to be forgotten. If you decide to stop using BudgetSetu, you can delete your profile at any time:
            </p>
            <div className="card border-destructive/20 bg-destructive-bg/10 p-5 flex items-start gap-4">
              <Trash2 className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-destructive text-body-md font-semibold">Instant Wiping Policy</h4>
                <p className="text-body-sm text-text-secondary leading-relaxed">
                  Triggering account deletion instantly deletes all associated transactions, accounts, budgets, goals, and user keys. Since raw statement files are never stored, all your data is fully wiped, leaving zero backup logs.
                </p>
              </div>
            </div>
            <p>
              You can initiate self-service deletion in the <strong>Settings</strong> panel, or submit a request directly on our <strong>Data Deletion</strong> page.
            </p>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};
