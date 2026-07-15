import React, { useMemo, useState } from "react";
import { PublicLayout } from "../../components/layout/PublicLayout";
import { EyeOff, Settings, ShieldCheck } from "lucide-react";

// Builds the grievance contact email from character codes at render time
// instead of storing it as a plain-text literal in the bundle, to make
// naive scraping/spam bots harder. Kept consistent with Privacy.tsx / Terms.tsx.
const buildGrievanceEmail = (): string => {
  const codes = [
    119, 111, 114, 107, 46, 118, 105, 110, 97, 121, 112, 114, 97, 98, 104, 97,
    107, 97, 114, 64, 103, 109, 97, 105, 108, 46, 99, 111, 109,
  ];
  return codes.map((c) => String.fromCharCode(c)).join("");
};

export const CookiePolicy: React.FC = () => {
  const grievanceEmail = useMemo(() => buildGrievanceEmail(), []);
  const [emailRevealed, setEmailRevealed] = useState(false);

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-6 py-16 md:py-24 space-y-12">
        {/* Header */}
        <div className="space-y-3 border-b border-border pb-6">
          <h1 className="font-display text-text-primary text-hero-md tracking-tight">
            Cookie Policy
          </h1>
          <p className="text-text-secondary text-body-sm">
            Last Updated: July 5, 2026
          </p>
        </div>
        {/* Introduction */}
        <div className="text-text-secondary text-body-md leading-relaxed space-y-4">
          <p>
            This Cookie Policy explains how BudgetSetu, operated by Vinay Kumar,
            uses cookies and similar storage technologies. We believe in keeping
            data collection minimal, which is why we{" "}
            <strong>only use cookies that are strictly necessary</strong> to
            operate the application.
          </p>
          <p>
            We do not use advertising trackers, third-party analytics pixels, or
            behavior-profiling cookies. This policy should be read together with
            our <strong>Privacy Policy</strong>, which describes in full how we
            collect, store, and safeguard your personal data.
          </p>
        </div>
        {/* 1. What are Cookies */}
        <section className="space-y-4">
          <h2 className="font-display text-text-primary text-heading-lg tracking-tight">
            1. What Are Cookies?
          </h2>
          <p className="text-text-secondary text-body-md leading-relaxed">
            Cookies are small text files stored on your computer or mobile
            device when you browse websites. They are commonly used to remember
            login credentials, store preferences, or deliver analytics.
          </p>
        </section>
        {/* 2. Cookies We Use */}
        <section className="space-y-6">
          <h2 className="font-display text-text-primary text-heading-lg tracking-tight">
            2. Cookies & Local Storage We Set
          </h2>
          <div className="space-y-4">
            <p className="text-text-secondary text-body-md">
              We employ only two types of identifiers to maintain your session
              and visual style:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Cookie 1 */}
              <div className="card space-y-2.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-brand shrink-0" />
                  <h3 className="text-text-primary text-body-md font-semibold">
                    Secure Refresh Token
                  </h3>
                </div>
                <p className="text-body-sm text-text-secondary leading-relaxed">
                  <strong>
                    Type: Cookie (HttpOnly, Secure, SameSite=Strict)
                  </strong>
                  <br />
                  <strong>Duration:</strong> Expires 24 hours after issuance, or
                  immediately upon logout, whichever happens first.
                  <br />
                  This token allows you to remain logged in. Because it is set
                  with the <code>HttpOnly</code> attribute, it cannot be read or
                  accessed by browser-side scripts, which helps protect the
                  token itself from being stolen through cross-site scripting
                  (XSS) attacks.
                </p>
              </div>
              {/* Cookie 2 */}
              <div className="card space-y-2.5">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-brand shrink-0" />
                  <h3 className="text-text-primary text-body-md font-semibold">
                    UI Preferences
                  </h3>
                </div>
                <p className="text-body-sm text-text-secondary leading-relaxed">
                  <strong>Type: Local Storage</strong>
                  <br />
                  <strong>Duration:</strong> Persists on your device until you
                  clear your browser data or change the setting; it is not sent
                  to our servers.
                  <br />
                  Stores your interface preferences, such as theme (light or
                  dark mode) and other display settings, to ensure the
                  application renders the way you expect immediately when the
                  document loads, preventing annoying flashes of default
                  styling.
                </p>
              </div>
            </div>
          </div>
        </section>
        {/* 3. Third-party cookies */}
        <section className="space-y-4">
          <h2 className="font-display text-text-primary text-heading-lg tracking-tight flex items-center gap-2">
            <EyeOff className="h-5 w-5 text-brand" />
            <span>3. No Third-Party Analytics or Marketing Cookies</span>
          </h2>
          <p className="text-text-secondary text-body-md leading-relaxed">
            BudgetSetu does not host advertisements, retargeting campaigns, or
            external diagnostic pixels. We do not use Google Analytics or other
            performance tracking engines. As a result, no third-party domains
            will place cookies on your browser through our platform.
          </p>
        </section>
        {/* 4. How to Opt-out */}
        <section className="space-y-4">
          <h2 className="font-display text-text-primary text-heading-lg tracking-tight">
            4. Managing Your Cookie Choices
          </h2>
          <div className="text-text-secondary text-body-md space-y-3 leading-relaxed">
            <p>
              You can block or delete cookies through your browser settings:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Open your browser's settings panel (e.g., Privacy & Security).
              </li>
              <li>Search for cookies and site data settings.</li>
              <li>Choose to block third-party cookies or block all cookies.</li>
            </ul>
            <p>
              Please note that{" "}
              <strong>
                blocking all cookies will prevent you from signing in
              </strong>{" "}
              to BudgetSetu, as we require the HttpOnly session cookie to
              authenticate your requests.
            </p>
          </div>
        </section>
        {/* 5. Changes to This Policy */}
        <section className="space-y-4">
          <h2 className="font-display text-text-primary text-heading-lg tracking-tight">
            5. Changes to This Policy
          </h2>
          <p className="text-text-secondary text-body-md leading-relaxed">
            We may update this Cookie Policy from time to time to reflect
            changes in the identifiers we use. We will post the revised policy
            on this page with an updated "Last Updated" date, and for material
            changes, we will notify you by email or in-app notice before the
            changes take effect.
          </p>
        </section>
        {/* 6. Questions or Complaints */}
        <section className="space-y-4">
          <h2 className="font-display text-text-primary text-heading-lg tracking-tight">
            6. Questions or Complaints
          </h2>
          <div className="text-text-secondary text-body-md space-y-3 leading-relaxed">
            <p>
              If you have questions or complaints about our use of cookies, you
              may contact our designated Grievance Officer:
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
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};
