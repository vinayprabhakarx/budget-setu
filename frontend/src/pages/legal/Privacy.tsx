import React, { useMemo, useState } from "react";
import { PublicLayout } from "../../components/layout/PublicLayout";
import { Lock, Trash2 } from "lucide-react";

// Builds the grievance contact email from character codes at render time
// instead of storing it as a plain-text literal in the bundle, to make
// naive scraping/spam bots harder.
const buildGrievanceEmail = (): string => {
  const codes = [
    119, 111, 114, 107, 46, 118, 105, 110, 97, 121, 112, 114, 97, 98, 104, 97,
    107, 97, 114, 64, 103, 109, 97, 105, 108, 46, 99, 111, 109,
  ];
  return codes.map((c) => String.fromCharCode(c)).join("");
};

export const Privacy: React.FC = () => {
  const grievanceEmail = useMemo(() => buildGrievanceEmail(), []);
  const [emailRevealed, setEmailRevealed] = useState(false);
  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-6 py-16 md:py-24 space-y-12">
        {/* Header */}
        <div className="space-y-3 border-b border-border pb-6">
          <h1 className="font-display text-text-primary text-[2.5rem] md:text-[3.5rem] tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-text-secondary text-body-sm">
            Last Updated: July 5, 2026
          </p>
        </div>

        {/* Introduction */}
        <div className="text-text-secondary text-body-md leading-relaxed space-y-4">
          <p>
            BudgetSetu ("BudgetSetu", "we", "us", "our") is a personal finance
            management application built and operated by Vinay Kumar, an
            individual developer, to help users track, organize, and understand
            their own finances. We do not sell your personal data or transaction
            records to advertisers or data brokers, and we do not monetize your
            financial information.
          </p>
          <p>
            This Privacy Policy is published in accordance with the{" "}
            <strong>
              Digital Personal Data Protection Act, 2023 ("DPDPA")
            </strong>
            , the <strong>Information Technology Act, 2000</strong>, and the{" "}
            <strong>
              Information Technology (Reasonable Security Practices and
              Procedures and Sensitive Personal Data or Information) Rules, 2011
              ("SPDI Rules")
            </strong>
            . It explains what personal data we collect as a "Data Fiduciary"
            under the DPDPA, why we collect it, how it is stored and
            safeguarded, and the rights available to you as a "Data Principal."
          </p>
          <p>
            BudgetSetu is intended for use by residents of India and this policy
            is governed by Indian law. By creating an account, uploading a bank
            or UPI statement, or otherwise using BudgetSetu, you consent to the
            collection and processing of your personal data as described in this
            policy.
          </p>
          <p>
            <strong>Regulatory clarification:</strong> BudgetSetu is a personal
            finance management tool. It is not a bank, a Non-Banking Financial
            Company ("NBFC"), or a licensed Account Aggregator under the Reserve
            Bank of India (Account Aggregator) directions. We do not fetch your
            bank data directly from your bank or from any Account Aggregator;
            you upload your own statement files or enter transactions manually,
            entirely at your discretion.
          </p>
        </div>

        {/* 1. What We Collect */}
        <section className="space-y-4">
          <h2 className="font-display text-text-primary text-heading-lg tracking-tight">
            1. Information We Collect
          </h2>
          <div className="text-text-secondary text-body-md space-y-3">
            <p>
              We collect the following categories of personal data, only after
              obtaining your consent at the point of collection, and only to the
              extent necessary to provide our services:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Account Credentials:</strong> Full name, email address,
                and password. Passwords are salted and hashed using BCrypt
                before storage; we never store passwords in plain text and
                cannot retrieve your original password.
              </li>
              <li>
                <strong>Financial Account Profiles:</strong> Account nicknames,
                masked account numbers, bank names, and balances that you
                manually enter or import.
              </li>
              <li>
                <strong>Uploaded Statement Files:</strong> PDF, CSV, or Excel
                files containing transaction history from your bank or UPI
                statements, uploaded voluntarily by you for the sole purpose of
                populating your transaction ledger.
              </li>
              <li>
                <strong>Transaction Ledgers:</strong> Date, amount, normalized
                merchant descriptions, classification categories, notes, and
                tags derived from the statements you upload or transactions you
                enter.
              </li>
              <li>
                <strong>Merchant Classification Rules:</strong> Custom rules and
                patterns you create to direct automated category tagging.
              </li>
              <li>
                <strong>Technical & Usage Data:</strong> Login timestamps, IP
                address, device/browser type, and application logs, collected
                for security, fraud prevention, and debugging purposes.
              </li>
            </ul>
            <p>
              We treat your financial account details and transaction records as
              sensitive personal data under the SPDI Rules and apply enhanced
              safeguards to them as described in Section 2.
            </p>
          </div>
        </section>

        {/* 2. Basis and Purpose of Processing */}
        <section className="space-y-4">
          <h2 className="font-display text-text-primary text-heading-lg tracking-tight">
            2. Why We Process Your Data
          </h2>
          <div className="text-text-secondary text-body-md space-y-3">
            <p>
              We process your personal data only for the following specified
              purposes, and only on the basis of your explicit consent given at
              signup or at the time of a specific feature use (e.g., statement
              upload):
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Creating and authenticating your account.</li>
              <li>
                Parsing uploaded statements to populate your transaction ledger.
              </li>
              <li>
                Categorizing transactions, generating budgets, goals, and
                analytics dashboards.
              </li>
              <li>
                Sending you transactional emails such as welcome messages,
                password resets, and budget threshold alerts.
              </li>
              <li>
                Detecting fraud, abuse, or unauthorized access to your account.
              </li>
              <li>
                Complying with applicable law or lawful requests from Indian
                government or judicial authorities.
              </li>
            </ul>
            <p>
              You may withdraw your consent at any time by deleting your account
              as described in Section 6. Withdrawing consent will not affect the
              lawfulness of processing carried out before withdrawal, and may
              result in your inability to continue using BudgetSetu.
            </p>
          </div>
        </section>

        {/* 3. Data Storage & Security */}
        <section className="space-y-4">
          <h2 className="font-display text-text-primary text-heading-lg tracking-tight">
            3. Data Storage, Localization & Security
          </h2>
          <div className="text-text-secondary text-body-md space-y-4">
            <p>
              <strong>
                All personal data collected through BudgetSetu is stored
                exclusively on servers located within India.
              </strong>{" "}
              We do not transfer, store, or process your personal data outside
              Indian territory, and we do not use any data localization
              exemption under the DPDPA to move your data abroad.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="card space-y-2.5">
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-brand shrink-0" />
                  <h3 className="text-text-primary text-body-md font-semibold">
                    Data Security
                  </h3>
                </div>
                <p className="text-body-sm leading-relaxed">
                  All database data is encrypted at rest using industry-standard
                  AES-256 encryption. Access to your account, financial
                  profiles, and transaction data is enforced at the application
                  layer through authenticated, token-based authorization: every
                  request is verified against your identity before any record is
                  read or written, so your data is logically isolated from other
                  users' data.
                </p>
              </div>

              <div className="card space-y-2.5">
                <div className="flex items-center gap-2">
                  <Trash2 className="h-5 w-5 text-brand shrink-0" />
                  <h3 className="text-text-primary text-body-md font-semibold">
                    File Encryption &amp; Deletion
                  </h3>
                </div>
                <p className="text-body-sm leading-relaxed">
                  Uploaded statement files are encrypted immediately upon
                  receipt using a key that is not accessible to our system
                  administrators, meaning no one at BudgetSetu can read your
                  uploaded files. These files are permanently and automatically
                  deleted from our servers within 24 hours of upload, once your
                  transaction data has been extracted. You also have a one-click
                  option in Settings to instantly and permanently delete your
                  entire account and all associated data.
                </p>
              </div>
            </div>
            <p>
              We do not sell your data to third parties, and we do not use
              advertising networks or trackers of any kind. BudgetSetu exists
              solely to serve you as a personal finance tool, not as a
              data-harvesting engine.
            </p>
            <p>
              We retain reasonable security practices as required under Section
              43A of the Information Technology Act, 2000 and the SPDI Rules,
              including encrypted connections, hashed credentials, and
              restricted administrative access. No method of transmission or
              storage is completely secure, and we cannot guarantee absolute
              security.
            </p>
          </div>
        </section>

        {/* 4. Local Backup & Restore */}
        <section className="space-y-4">
          <h2 className="font-display text-text-primary text-heading-lg tracking-tight">
            4. Local Backup & Restore
          </h2>
          <div className="text-text-secondary text-body-md space-y-3">
            <p>
              BudgetSetu allows you to export a backup of your account data as a
              ZIP file, which you can optionally protect with a password of your
              choosing. This backup file is generated for you and downloaded
              directly to your own device — it is never uploaded to or stored on
              our servers. You may later restore your data by uploading this
              same backup file back into BudgetSetu.
            </p>
            <p>
              Because this backup file lives entirely on your device (or
              wherever you choose to store it), you are solely responsible for
              keeping it safe. If you choose not to password-protect your
              backup, anyone with access to the file will be able to read its
              contents. We recommend using the password-protected option,
              especially if you intend to store the file in cloud storage, email
              it to yourself, or keep it anywhere other than a device only you
              control.
            </p>
          </div>
        </section>

        {/* 5. Data Retention */}
        <section className="space-y-4">
          <h2 className="font-display text-text-primary text-heading-lg tracking-tight">
            5. Data Retention
          </h2>
          <div className="text-text-secondary text-body-md space-y-3">
            <p>
              We retain your personal data for as long as your account remains
              active, or as needed to provide you the service. If you delete
              your account, your personal data is deleted in accordance with
              Section 6, except where we are required to retain limited records
              to comply with a legal obligation, resolve disputes, or enforce
              our agreements, in which case such data is retained only for the
              minimum period required by law and is not used for any other
              purpose.
            </p>
          </div>
        </section>

        {/* 5. Third-Party Subprocessors */}
        <section className="space-y-4">
          <h2 className="font-display text-text-primary text-heading-lg tracking-tight">
            6. Third-Party Subprocessors
          </h2>
          <p className="text-text-secondary text-body-md leading-relaxed">
            We engage a limited set of infrastructure and utility providers to
            operate BudgetSetu. Each provider processes data strictly on our
            instructions and only to the extent necessary to perform its
            function. We do not sell or rent your personal data to any third
            party, and we do not permit these providers to use your data for
            their own purposes.
          </p>
          <ul className="list-disc pl-6 space-y-2 text-text-secondary text-body-md">
            <li>
              <strong>Application Hosting:</strong> Our backend application
              servers are hosted on cloud infrastructure located within India.
            </li>
            <li>
              <strong>Database (Supabase, Mumbai region):</strong> Your account,
              financial profile, and transaction data is stored in a PostgreSQL
              database hosted in Supabase's Mumbai, India region.
            </li>
            <li>
              <strong>Cache (Redis, Mumbai region):</strong> Temporary session
              and application cache data is stored in a Redis instance hosted in
              the Mumbai, India region.
            </li>
            <li>
              <strong>Content Delivery & Edge Network:</strong> A content
              delivery network used to route traffic securely to our servers.
              This provider does not persist your personal data at rest.
            </li>
            <li>
              <strong>Mailgun:</strong> Used solely for transactional email
              delivery (welcome, password reset, and budget threshold alert
              emails).
            </li>
          </ul>
          <p className="text-text-secondary text-body-md leading-relaxed">
            If we engage any new subprocessor that materially changes how your
            data is handled, we will update this policy and, where required by
            law, seek your fresh consent.
          </p>
        </section>

        {/* 6. User Rights & Data Deletion */}
        <section className="space-y-4">
          <h2 className="font-display text-text-primary text-heading-lg tracking-tight">
            7. Your Rights & Account Deletion
          </h2>
          <div className="text-text-secondary text-body-md space-y-4">
            <p>
              As a Data Principal under the DPDPA, you have the right to access,
              correct, and erase your personal data, the right to withdraw
              consent at any time, the right to nominate another individual to
              exercise your rights in the event of your death or incapacity, and
              the right to grievance redressal as described below.
            </p>
            <div className="card border-destructive/20 bg-destructive-bg/10 p-5 space-y-2.5">
              <div className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-destructive shrink-0" />
                <h3 className="text-destructive text-body-md font-semibold">
                  Account Deletion
                </h3>
              </div>
              <p className="text-body-sm text-text-secondary leading-relaxed">
                Deleting your account permanently removes your transactions,
                accounts, budgets, goals, and login credentials from our
                active systems. Since raw statement files are not retained
                after processing, no separate copy of your uploaded files
                persists. Please note that routine, encrypted backups of our
                database (retained for a limited period for disaster recovery)
                may take a short time to fully purge after deletion; these
                backups are not accessed for any purpose other than restoring
                service in the event of a failure.
              </p>
            </div>
            <p>
              You can initiate self-service deletion from the{" "}
              <strong>Settings</strong> panel, or submit a request through our{" "}
              <strong>Data Deletion</strong> page. We will act on deletion
              requests within the timeline required by applicable law.
            </p>
          </div>
        </section>

        {/* 7. Children's Data */}
        <section className="space-y-4">
          <h2 className="font-display text-text-primary text-heading-lg tracking-tight">
            8. Children's Data
          </h2>
          <p className="text-text-secondary text-body-md leading-relaxed">
            BudgetSetu is not directed at, and is not intended for use by,
            individuals under 18 years of age. We do not knowingly collect
            personal data from children. If we become aware that a child's
            personal data has been collected without verifiable parental
            consent, we will delete it promptly.
          </p>
        </section>

        {/* 8. Data Breach Notification */}
        <section className="space-y-4">
          <h2 className="font-display text-text-primary text-heading-lg tracking-tight">
            9. Data Breach Notification
          </h2>
          <p className="text-text-secondary text-body-md leading-relaxed">
            In the event of a personal data breach that affects you, we will
            notify you and, where required, the Data Protection Board of India,
            in the manner and within the timeline prescribed under the DPDPA and
            its rules.
          </p>
        </section>

        {/* 9. Grievance Redressal */}
        <section className="space-y-4">
          <h2 className="font-display text-text-primary text-heading-lg tracking-tight">
            10. Grievance Officer
          </h2>
          <div className="text-text-secondary text-body-md space-y-3">
            <p>
              In accordance with the DPDPA and the Information Technology Act,
              2000, we have designated a Grievance Officer to address your
              queries, complaints, or requests regarding your personal data:
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
                <strong>Response Timeline:</strong> We will acknowledge your
                complaint promptly and aim to resolve it within 30 days.
              </p>
            </div>
            <p>
              If you are not satisfied with our resolution, you may escalate
              your complaint to the{" "}
              <strong>Data Protection Board of India</strong> as provided under
              the DPDPA.
            </p>
          </div>
        </section>

        {/* 10. Changes to this Policy */}
        <section className="space-y-4">
          <h2 className="font-display text-text-primary text-heading-lg tracking-tight">
            11. Changes to This Policy
          </h2>
          <p className="text-text-secondary text-body-md leading-relaxed">
            We may update this Privacy Policy from time to time to reflect
            changes in our practices or applicable law. We will post the revised
            policy on this page with an updated "Last Updated" date, and for
            material changes, we will notify you by email or in-app notice
            before the changes take effect.
          </p>
        </section>
      </div>
    </PublicLayout>
  );
};
