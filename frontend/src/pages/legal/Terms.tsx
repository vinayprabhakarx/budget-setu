import React, { useMemo, useState } from "react";
import { PublicLayout } from "../../components/layout/PublicLayout";
import { ShieldAlert } from "lucide-react";

// Builds the grievance contact email from character codes at render time
// instead of storing it as a plain-text literal in the bundle, to make
// naive scraping/spam bots harder. Kept consistent with Privacy.tsx.
const buildGrievanceEmail = (): string => {
  const codes = [
    119, 111, 114, 107, 46, 118, 105, 110, 97, 121, 112, 114, 97, 98, 104, 97,
    107, 97, 114, 64, 103, 109, 97, 105, 108, 46, 99, 111, 109,
  ];
  return codes.map((c) => String.fromCharCode(c)).join("");
};

export const Terms: React.FC = () => {
  const grievanceEmail = useMemo(() => buildGrievanceEmail(), []);
  const [emailRevealed, setEmailRevealed] = useState(false);

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-6 py-16 md:py-24 space-y-12">
        {/* Header */}
        <div className="space-y-3 border-b border-border pb-6">
          <h1 className="font-display text-text-primary text-[2.5rem] md:text-[3.5rem] tracking-tight">
            Terms of Service
          </h1>
          <p className="text-text-secondary text-body-sm">
            Last Updated: July 5, 2026
          </p>
        </div>

        {/* Introduction */}
        <div className="text-text-secondary text-body-md leading-relaxed space-y-4">
          <p>
            Welcome to BudgetSetu. These Terms of Service ("Terms") govern your
            access to and use of the BudgetSetu website, applications, APIs, and
            associated statement parsing tools, operated by Vinay Kumar
            ("BudgetSetu", "we", "us", "our").
          </p>
          <p>
            By creating an account, uploading files, or interacting with the
            service, you agree to be bound by these Terms. If you do not agree,
            please do not use the application.
          </p>
          <p>
            <strong>Eligibility:</strong> BudgetSetu is intended for use by
            individuals who are at least 18 years of age and capable of entering
            into a legally binding contract under the Indian Contract Act, 1872.
            By using BudgetSetu, you confirm that you meet this requirement.
          </p>
        </div>

        {/* 1. Account Creation */}
        <section className="space-y-4">
          <h2 className="font-display text-text-primary text-heading-lg tracking-tight">
            1. User Registration & Security
          </h2>
          <div className="text-text-secondary text-body-md space-y-3 leading-relaxed">
            <p>
              To access BudgetSetu, you must create an account with a valid
              email address and a strong password. You are responsible for:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Maintaining the confidentiality of your session and password.
              </li>
              <li>
                Restricting access to devices holding your active session
                credentials.
              </li>
              <li>
                Notifying us immediately of any unauthorized access or breach of
                credentials.
              </li>
            </ul>
            <p>
              BudgetSetu is not liable for any losses caused by unauthorized use
              of your credentials where such use resulted from your failure to
              keep your credentials secure.
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
              You may upload PDF, CSV, or Excel statements in the common formats
              used by major Indian banks and UPI payment applications. All
              uploaded files are encrypted immediately upon receipt using a key
              that is not accessible to our system administrators, and are
              permanently and automatically deleted from our servers within 24
              hours of upload, once your transaction data has been extracted.
              You represent and warrant that:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                You own or have authorization to process the transaction
                statements uploaded.
              </li>
              <li>
                The files do not contain malware, corrupted data, or code
                designed to interfere with our servers.
              </li>
              <li>
                You will not use scraping tools, crawlers, or automated bots to
                stress-test, scrape, or extract data from the dashboards or
                underlying application.
              </li>
            </ul>
            <p>
              BudgetSetu also allows you to export an optionally
              password-protected backup of your account data as a ZIP file,
              which is downloaded to your device and never uploaded to our
              servers. You are solely responsible for the safekeeping of any
              backup file you export, including choosing to password-protect it
              before storing or sharing it anywhere.
            </p>
            <p>
              References to any bank, payment application, or financial
              institution in connection with supported statement formats are
              made solely to describe file compatibility. BudgetSetu is not
              affiliated with, endorsed by, or sponsored by any bank or payment
              application, and all related trademarks and logos, if displayed,
              remain the property of their respective owners.
            </p>
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
                BudgetSetu is a record-keeping and data aggregation utility.{" "}
                <strong>
                  We do not provide investment, tax, legal, or general financial
                  advice
                </strong>
                . All statement parser calculations, budget percentages, and
                savings projections are provided as-is, strictly for educational
                and personal record-keeping purposes.
              </p>
            </div>
            <p>
              The accuracy of imported ledger summaries depends entirely on the
              layout integrity of your statement files. You must manually verify
              all calculated balances, tax categorizations, and statement
              records before executing financial transactions, submitting tax
              declarations, or making business decisions. BudgetSetu is not a
              substitute for advice from a qualified financial advisor,
              chartered accountant, or tax professional.
            </p>
          </div>
        </section>

        {/* 4. Service Provided "As Is" */}
        <section className="space-y-4">
          <h2 className="font-display text-text-primary text-heading-lg tracking-tight">
            4. Service Provided "As Is"
          </h2>
          <p className="text-text-secondary text-body-md leading-relaxed">
            BudgetSetu is provided on an "as is" and "as available" basis,
            without warranties of any kind, whether express or implied,
            including without limitation warranties of merchantability, fitness
            for a particular purpose, accuracy, or non-infringement. We do not
            warrant that the service will be uninterrupted, timely, secure, or
            error-free, or that any statement parsing, categorization, or
            calculation will be accurate or complete.
          </p>
        </section>

        {/* 5. Intellectual Property */}
        <section className="space-y-4">
          <h2 className="font-display text-text-primary text-heading-lg tracking-tight">
            5. Intellectual Property
          </h2>
          <div className="text-text-secondary text-body-md space-y-3 leading-relaxed">
            <p>
              The BudgetSetu application, including its design, source code,
              branding, and underlying technology, is owned by Vinay Kumar and
              is protected under applicable Indian copyright, trademark, and
              intellectual property laws. Except for the limited right to use
              the application as intended, no license or ownership right is
              transferred to you.
            </p>
            <p>
              You retain ownership of the financial data, statement files, and
              records you upload. By using BudgetSetu, you grant us a limited
              right to process this data solely for the purpose of providing the
              service to you, as described in our Privacy Policy.
            </p>
          </div>
        </section>

        {/* 6. Suspension & Termination */}
        <section className="space-y-4">
          <h2 className="font-display text-text-primary text-heading-lg tracking-tight">
            6. Suspension & Termination
          </h2>
          <div className="text-text-secondary text-body-md space-y-3 leading-relaxed">
            <p>
              You may stop using BudgetSetu and delete your account at any time
              through the Settings panel. We may suspend or terminate your
              access to BudgetSetu, with or without prior notice, if we
              reasonably believe you have violated these Terms, engaged in
              fraudulent or abusive conduct, or posed a security risk to the
              service or other users.
            </p>
            <p>
              Upon termination, your right to use BudgetSetu ceases immediately.
              Your data will be handled in accordance with the account deletion
              process described in our Privacy Policy.
            </p>
          </div>
        </section>

        {/* 7. Indemnification */}
        <section className="space-y-4">
          <h2 className="font-display text-text-primary text-heading-lg tracking-tight">
            7. Indemnification
          </h2>
          <p className="text-text-secondary text-body-md leading-relaxed">
            You agree to indemnify and hold harmless BudgetSetu and Vinay Kumar
            from any claims, losses, liabilities, damages, or expenses
            (including reasonable legal fees) arising out of your violation of
            these Terms, your misuse of the service, or your violation of any
            applicable law or third-party right.
          </p>
        </section>

        {/* 8. Limitation of Liability */}
        <section className="space-y-4">
          <h2 className="font-display text-text-primary text-heading-lg tracking-tight">
            8. Limitation of Liability
          </h2>
          <p className="text-text-secondary text-body-md leading-relaxed">
            To the maximum extent permitted under applicable Indian law,
            BudgetSetu and Vinay Kumar shall not be liable for any indirect,
            incidental, special, consequential, or punitive damages — including
            loss of profits, investment losses, data corruption, or server
            downtime — arising from your use of the statement parser,
            dashboards, or email alerts, even if advised of the possibility of
            such damages. Nothing in these Terms limits any liability that
            cannot be limited or excluded under applicable Indian law.
          </p>
        </section>

        {/* 9. Grievance Redressal */}
        <section className="space-y-4">
          <h2 className="font-display text-text-primary text-heading-lg tracking-tight">
            9. Grievance Redressal
          </h2>
          <div className="text-text-secondary text-body-md space-y-3 leading-relaxed">
            <p>
              If you have any complaint or grievance regarding these Terms or
              your use of BudgetSetu, you may contact our designated Grievance
              Officer:
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
          </div>
        </section>

        {/* 10. Changes to These Terms */}
        <section className="space-y-4">
          <h2 className="font-display text-text-primary text-heading-lg tracking-tight">
            10. Changes to These Terms
          </h2>
          <p className="text-text-secondary text-body-md leading-relaxed">
            We may revise these Terms from time to time. We will post the
            updated Terms on this page with a revised "Last Updated" date, and
            for material changes, we will make reasonable efforts to notify you
            by email or in-app notice before the changes take effect. Continued
            use of BudgetSetu after changes take effect constitutes acceptance
            of the revised Terms.
          </p>
        </section>

        {/* 11. Governing Law & Jurisdiction */}
        <section className="space-y-4">
          <h2 className="font-display text-text-primary text-heading-lg tracking-tight">
            11. Governing Law & Jurisdiction
          </h2>
          <p className="text-text-secondary text-body-md leading-relaxed">
            These Terms are governed by and construed in accordance with the
            laws of India, without giving effect to conflict of laws principles.
            Any disputes arising under or in connection with these Terms shall
            be subject to the exclusive jurisdiction of the competent courts at
            Bengaluru, Karnataka, India.
          </p>
        </section>

        {/* 12. Severability & Entire Agreement */}
        <section className="space-y-4">
          <h2 className="font-display text-text-primary text-heading-lg tracking-tight">
            12. Severability & Entire Agreement
          </h2>
          <p className="text-text-secondary text-body-md leading-relaxed">
            If any provision of these Terms is found to be invalid or
            unenforceable by a court of competent jurisdiction, the remaining
            provisions will continue in full force and effect. These Terms,
            together with our Privacy Policy, constitute the entire agreement
            between you and BudgetSetu regarding your use of the service, and
            supersede any prior agreements or understandings.
          </p>
        </section>
      </div>
    </PublicLayout>
  );
};
