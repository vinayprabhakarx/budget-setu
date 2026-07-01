import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle } from "lucide-react";
import { PublicLayout } from "../../components/layout/PublicLayout";

export const EmailVerificationSuccess: React.FC = () => {
  return (
    <PublicLayout>
      <div className="grow flex items-center justify-center px-4 py-12 md:py-20">
        <div className="w-full max-w-110 text-center space-y-7">
          <div className="space-y-3">
            <div className="flex justify-center">
              <CheckCircle className="h-14 w-14 text-success" />
            </div>
            <h1 className="font-display text-text-primary text-3xl md:text-4xl leading-tight">
              Email Verified
            </h1>
            <p className="text-text-secondary text-body-sm leading-relaxed">
              Your email address has been verified. You can now continue to your
              BudgetSetu account.
            </p>
          </div>

          <div className="w-full flex justify-center">
            <Link
              to="/login"
              className="btn btn-primary inline-flex items-center justify-center gap-2 px-8 py-3 w-fit"
            >
              Continue to Sign In
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};
