import React from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { ArrowRight, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const DataDeletion: React.FC = () => {
  const { user } = useAuth();

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-6 py-16 md:py-24 space-y-12">
        {/* Header */}
        <div className="space-y-3 border-b border-border pb-6">
          <h1 className="font-display text-text-primary text-[2.5rem] md:text-[3.5rem] tracking-tight">
            Data Deletion
          </h1>
          <p className="text-text-secondary text-body-sm">
            Last Updated: June 15, 2026
          </p>
        </div>

        {/* Introduction */}
        <div className="text-text-secondary text-body-md leading-relaxed space-y-4">
          <p>
            We respect your right to control your personal and financial information. You can request deletion of your BudgetSetu account and all associated data at any time — no questions asked.
          </p>
          <p>
            This page explains what data is removed, how to initiate deletion, and how long it takes.
          </p>
        </div>

        {/* 1. What gets deleted */}
        <section className="space-y-4">
          <h2 className="font-display text-text-primary text-heading-lg tracking-tight">
            1. What Gets Deleted
          </h2>
          <div className="text-text-secondary text-body-md space-y-3 leading-relaxed">
            <p>When your account is deleted, the following data is permanently removed from our systems:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your user profile, display name, email address, and encrypted password hash.</li>
              <li>All linked bank accounts and associated financial metadata.</li>
              <li>Every transaction record, merchant label, category tag, and import history.</li>
              <li>All budget rules, spending limits, and category configurations.</li>
              <li>Savings goals and contribution history.</li>
              <li>Any OAuth tokens or third-party login linkages stored on our side.</li>
            </ul>
            <p>
              Raw statement files (PDF, CSV, Excel) are processed entirely in-memory and are never persisted to disk, so there is nothing to delete for uploaded files.
            </p>
          </div>
        </section>

        {/* 2. How to request deletion */}
        <section className="space-y-4">
          <h2 className="font-display text-text-primary text-heading-lg tracking-tight">
            2. How to Request Deletion
          </h2>
          <div className="text-text-secondary text-body-md space-y-4 leading-relaxed">
            <div className="space-y-1">
              <p className="font-semibold text-text-primary">Option 1 — Self-service (instant)</p>
              <p>
                Log in to your account, open <strong>Settings</strong>, and scroll to the <em>Danger Zone</em> section. Clicking <em>Delete Account</em> permanently wipes your data immediately with no waiting period.
              </p>
            </div>
            {user && (
              <Link to="/settings" className="btn btn-secondary btn-sm flex items-center gap-2 w-fit">
                <span>Go to Settings</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            <div className="space-y-1">
              <p className="font-semibold text-text-primary">Option 2 — Email request</p>
              <p>
                If you no longer have access to your account, send a deletion request from your registered email address to{' '}
                <a href="mailto:privacy@budgetsetu.app" className="text-brand hover:underline">
                  privacy@budgetsetu.app
                </a>
                . Include your full name and the email associated with the account. We will verify your identity and process the deletion within <strong>24 hours</strong>.
              </p>
            </div>
          </div>
        </section>

        {/* 3. Irreversibility warning */}
        <section className="space-y-4">
          <h2 className="font-display text-text-primary text-heading-lg tracking-tight">
            3. This Action Is Permanent
          </h2>
          <div className="text-text-secondary text-body-md space-y-4 leading-relaxed">
            <div className="card border-destructive/20 bg-destructive-bg/10 p-5 flex items-start gap-4">
              <Trash2 className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-destructive text-body-md font-semibold">No Recovery After Deletion</h4>
                <p className="text-body-sm text-text-secondary leading-relaxed">
                  Once your account is deleted, all data is gone immediately and irreversibly. We do not retain backups, snapshots, or recovery archives of deleted accounts. There is no grace period, undo option, or support escalation that can restore your data.
                </p>
              </div>
            </div>
            <p>
              If you are unsure, consider exporting your transaction history from the <strong>Import</strong> page before proceeding.
            </p>
          </div>
        </section>

        {/* 4. Third-party data */}
        <section className="space-y-4">
          <h2 className="font-display text-text-primary text-heading-lg tracking-tight">
            4. Third-Party & OAuth Connections
          </h2>
          <p className="text-text-secondary text-body-md leading-relaxed">
            If you registered via Google or another OAuth provider, deleting your BudgetSetu account removes the linkage on our side but does not revoke the app permission on the provider's end. To fully disconnect BudgetSetu, visit your{' '}
            <a
              href="https://myaccount.google.com/permissions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              Google account's connected apps page
            </a>{' '}
            and remove BudgetSetu from there.
          </p>
        </section>

        {/* 5. Questions */}
        <section className="space-y-4">
          <h2 className="font-display text-text-primary text-heading-lg tracking-tight">
            5. Questions & Support
          </h2>
          <p className="text-text-secondary text-body-md leading-relaxed">
            If you have any questions about this policy or need help initiating a deletion request, contact our privacy team at{' '}
            <a href="mailto:privacy@budgetsetu.app" className="text-brand hover:underline">
              privacy@budgetsetu.app
            </a>
            . We typically respond within one business day.
          </p>
        </section>
      </div>
    </PublicLayout>
  );
};
