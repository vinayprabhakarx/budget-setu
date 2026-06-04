import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';

const COOKIE_CONSENT_KEY = 'budgetsetu_cookie_consent';

export const CookieBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(() => {
    // Check if user has already made a choice
    return !localStorage.getItem(COOKIE_CONSENT_KEY);
  });

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    setIsVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'rejected');
    setIsVisible(false);
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100%-2rem)] sm:w-96 p-5 bg-bg-elevated border border-border shadow-2xl rounded-xl animate-fade-up">
      <div className="flex flex-col gap-4">
        
        <div className="pr-6">
          <h3 className="text-body-lg font-semibold text-text-primary mb-1">
            We value your privacy
          </h3>
          <p className="text-body-sm text-text-secondary leading-relaxed">
            We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. Read our{' '}
            <Link to="/cookies" className="text-brand hover:underline font-medium">
              Cookie Policy
            </Link>.
          </p>
        </div>

        <div className="flex flex-row items-center gap-3 w-full">
          <button
            onClick={handleReject}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-text-primary bg-bg-subtle hover:bg-bg-muted rounded-md transition-colors border border-border whitespace-nowrap cursor-pointer"
          >
            Reject All
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-bg-base bg-brand hover:bg-brand-hover rounded-md transition-colors shadow-sm whitespace-nowrap cursor-pointer"
          >
            Accept All
          </button>
        </div>

        <button 
          onClick={handleClose}
          className="absolute top-5 right-5 text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
          aria-label="Close cookie banner"
        >
          <X size={18} />
        </button>
        
      </div>
    </div>
  );
};
