import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PublicLayout } from "../../components/layout/PublicLayout";
import { ArrowRight, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

// Builds the grievance contact email from character codes at render time
// instead of storing it as a plain-text literal in the bundle, to make
// naive scraping/spam bots harder. Kept consistent with Privacy.tsx / Terms.tsx / CookiePolicy.tsx.
const buildGrievanceEmail = (): string => {
  const codes = [
    119, 111, 114, 107, 46, 118, 105, 110, 97, 121, 112, 114, 97, 98, 104, 97,
    107, 97, 114, 64, 103, 109, 97, 105, 108, 46, 99, 111, 109,
  ];
  return codes.map((c) => String.fromCharCode(c)).join("");
};

export const DataDeletion: React.FC = () => {
  const { user } = useAuth();
  const grievanceEmail = useMemo(() => buildGrievanceEmail(), []);
  const [emailRevealed, setEmailRevealed] = useState(false);

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-6 py-16 md:py-24 space-y-12">
        {/* Header */}
        <div className="space-y-3 border-b border-border pb-6">
          <h1 className="font-display text-text-primary text-[2.5rem] md:text-[3.5rem] tracking-tight">
            Data Deletion
          </h1>
          <p className="text-text-secondary text-body-sm">
            Last Updated: July 5, 2026
          </p>
        </div>
        {/* Introduction */}
        <div className="text-text-secondary text-body-md leading-relaxed space-y-4">
          <p>
            We respect your right to control your personal and financial
            information. You can request deletion of your BudgetSetu account and
            all associated data at any time — no questions asked.
          </p>
          <p>
            This page explains what data is removed, how to initiate deletion,
            and how long it takes. It should be read together with our Privacy
            Policy, which describes our data retention and backup practices in
            full.
          </p>
        </div>
        {/* 1. What gets deleted */}
        <section className="space-y-4">
          <h2 className="font-display text-text-primary text-heading-lg tracking-tight">
            1. What Gets Deleted
          </h2>
          <div className="text-text-secondary text-body-md space-y-3 leading-relaxed">
            <p>
              When your account is deleted, the following data is permanently
              removed from our active systems:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Your user profile, display name, email address, and encrypted
                password hash.
              </li>
              <li>
                All linked bank accounts and associated financial metadata.
              </li>
              <li>
                Every transaction record, merchant label, category tag, and
                import history.
              </li>
              <li>
                All budget rules, spending limits, and category configurations.
              </li>
              <li>Savings goals and contribution history.</li>
              <li>
                Any OAuth tokens or third-party login linkages stored on our
                side.
              </li>
            </ul>
            <p>
              Uploaded statement files (PDF, CSV, Excel) are encrypted
              immediately upon receipt using a key that is not accessible to our
              system administrators, and are permanently and automatically
              deleted from our servers within 24 hours of upload, once your
              transaction data has been extracted — so there is nothing further
              to delete for uploaded files themselves.
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
              <p className="font-semibold text-text-primary">
                Option 1 — Self-service (instant)
              </p>
              <p>
                Log in to your account, open <strong>Settings</strong>, and
                scroll to the <em>Danger Zone</em> section. Clicking{" "}
                <em>Delete Account</em> removes your data from our active
                systems immediately with no waiting period.
              </p>
            </div>
            {user && (
              <Link
                to="/settings"
                className="btn btn-secondary btn-sm flex items-center gap-2 w-fit"
              >
                <span>Go to Settings</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            <div className="space-y-1">
              <p className="font-semibold text-text-primary">
                Option 2 — Email request
              </p>
              <p>
                If you no longer have access to your account, send a deletion
                request from your registered email address to our Grievance
                Officer at{" "}
                {emailRevealed ? (
                  <span className="text-brand">{grievanceEmail}</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEmailRevealed(true)}
                    className="text-brand underline underline-offset-2"
                    aria-label="Reveal grievance officer email address"
                  >
                    click to reveal email
                  </button>
                )}
                . Include your full name and the email associated with the
                account. We will verify your identity and process the deletion
                within <strong>24 hours</strong>.
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
            <div className="card border-destructive/20 bg-destructive-bg/10 p-5 space-y-2.5">
              <div className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-destructive shrink-0" />
                <h3 className="text-destructive text-body-md font-semibold">
                  No Recovery After Deletion
                </h3>
              </div>
              <p className="text-body-sm text-text-secondary leading-relaxed">
                Once your account is deleted, your data is removed from our
                active systems immediately and there is no self-service or
                support option to restore it. Routine, encrypted backups of
                our database, retained for a limited period for disaster
                recovery, may take a short time to fully purge after deletion;
                these backups are not accessed for any purpose other than
                restoring service in the event of a system failure, and are
                not used to recover an individually deleted account.
              </p>
            </div>
            <p>
              If you are unsure, use the <strong>Backup</strong> option in
              Settings to export a full, optionally password-protected copy of
              your data as a ZIP file to your device before proceeding. You can
              restore your data from this same file later if needed.
            </p>
          </div>
        </section>
        {/* 4. Third-party data */}
        <section className="space-y-4">
          <h2 className="font-display text-text-primary text-heading-lg tracking-tight">
            4. Third-Party & OAuth Connections
          </h2>
          <p className="text-text-secondary text-body-md leading-relaxed">
            If you registered via Google or another OAuth provider, deleting
            your BudgetSetu account removes the linkage on our side but does not
            revoke the app permission on the provider's end. To fully disconnect
            BudgetSetu, visit your{" "}
            <a
              href="https://myaccount.google.com/permissions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              Google account's connected apps page
            </a>{" "}
            and remove BudgetSetu from there.
          </p>
        </section>
        {/* 5. Questions */}
        <section className="space-y-4">
          <h2 className="font-display text-text-primary text-heading-lg tracking-tight">
            5. Questions & Support
          </h2>
          <div className="text-text-secondary text-body-md space-y-3 leading-relaxed">
            <p>
              If you have any questions about this policy or need help
              initiating a deletion request, contact our Grievance Officer:
            </p>
            <div className="card p-5 space-y-1">
              <p>
                <strong>Grievance Officer:</strong> Vinay Kumar
              </p>
              <p>
                <strong>Email:</strong>{" "}
                {emailRevealed ? (
                  grievanceEmail
                ) : (
                  <button
                    type="button"
                    onClick={() => setEmailRevealed(true)}
                    className="text-brand underline underline-offset-2"
                    aria-label="Reveal grievance officer email address"
                  >
                    Click to reveal email
                  </button>
                )}
              </p>
              <p>
                <strong>Response Timeline:</strong> We typically respond within
                one business day.
              </p>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};
