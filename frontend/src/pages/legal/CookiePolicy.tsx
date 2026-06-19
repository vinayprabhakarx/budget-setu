import React from 'react';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { EyeOff, Settings, ShieldCheck } from 'lucide-react';

export const CookiePolicy: React.FC = () => {
  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-6 py-16 md:py-24 space-y-12">
        {/* Header */}
        <div className="space-y-3 border-b border-border pb-6">
          <h1 className="font-display text-text-primary text-[2.5rem] md:text-[3.5rem] tracking-tight">
            Cookie Policy
          </h1>
          <p className="text-text-secondary text-body-sm">
            Last Updated: June 11, 2026
          </p>
        </div>

        {/* Introduction */}
        <div className="text-text-secondary text-body-md leading-relaxed space-y-4">
          <p>
            This Cookie Policy explains how BudgetSetu uses cookies and similar storage technologies. We believe in keeping data collection minimal, which is why we <strong>only use cookies that are strictly necessary</strong> to operate the application.
          </p>
          <p>
            We do not use advertising trackers, third-party analytics pixels, or behavior-profiling cookies.
          </p>
        </div>

        {/* 1. What are Cookies */}
        <section className="space-y-4">
          <h2 className="font-display text-text-primary text-heading-lg tracking-tight">
            1. What Are Cookies?
          </h2>
          <p className="text-text-secondary text-body-md leading-relaxed">
            Cookies are small text files stored on your computer or mobile device when you browse websites. They are commonly used to remember login credentials, store preferences, or deliver analytics.
          </p>
        </section>

        {/* 2. Cookies We Use */}
        <section className="space-y-6">
          <h2 className="font-display text-text-primary text-heading-lg tracking-tight">
            2. Cookies & Local Storage We Set
          </h2>
          <div className="space-y-4">
            <p className="text-text-secondary text-body-md">
              We employ only two types of identifiers to maintain your session and visual style:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Cookie 1 */}
              <div className="card space-y-2.5">
                <ShieldCheck className="h-5 w-5 text-brand" />
                <h3 className="text-text-primary text-body-md font-semibold">Secure Refresh Token</h3>
                <p className="text-body-sm text-text-secondary leading-relaxed">
                  <strong>Type: Cookie (HttpOnly, Secure, SameSite=Strict)</strong><br />
                  This token allows you to remain logged in. Because it is set with the <code>HttpOnly</code> attribute, it is completely inaccessible to browser scripts, protecting your session from cross-site scripting (XSS) attacks.
                </p>
              </div>

              {/* Cookie 2 */}
              <div className="card space-y-2.5">
                <Settings className="h-5 w-5 text-brand" />
                <h3 className="text-text-primary text-body-md font-semibold">Theme Preferences</h3>
                <p className="text-body-sm text-text-secondary leading-relaxed">
                  <strong>Type: Local Storage</strong><br />
                  Stores your manual theme choice (light or dark mode) to ensure the application renders with your preferred colors immediately when the document loads, preventing annoying white flashes.
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
            BudgetSetu does not host advertisements, retargeting campaigns, or external diagnostic pixels. We do not use Google Analytics or other performance tracking engines. As a result, no third-party domains will place cookies on your browser through our platform.
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
              <li>Open your browser's settings panel (e.g., Privacy & Security).</li>
              <li>Search for cookies and site data settings.</li>
              <li>Choose to block third-party cookies or block all cookies.</li>
            </ul>
            <p>
              Please note that <strong>blocking all cookies will prevent you from signing in</strong> to BudgetSetu, as we require the HttpOnly session cookie to authenticate your requests.
            </p>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};
