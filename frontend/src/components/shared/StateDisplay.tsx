import React from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Inbox, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../ui/Button';

export type StateType = 'loading' | 'empty' | 'error' | 'success';

export interface StateDisplayProps {
  type: StateType;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
}

export const StateDisplay: React.FC<StateDisplayProps> = ({
  type,
  title,
  description,
  icon,
  action,
  className = ''
}) => {
  const getDefaultIcon = () => {
    switch (type) {
      case 'loading':
        return <Loader2 className="h-8 w-8 animate-spin text-brand" />;
      case 'empty':
        return <Inbox className="h-10 w-10 text-text-muted opacity-50" />;
      case 'error':
        return <AlertCircle className="h-10 w-10 text-error" />;
      case 'success':
        return <CheckCircle className="h-10 w-10 text-success" />;
      default:
        return null;
    }
  };

  const getDefaultTitle = () => {
    switch (type) {
      case 'loading':
        return 'Loading...';
      case 'empty':
        return 'No data found';
      case 'error':
        return 'An error occurred';
      case 'success':
        return 'Success!';
      default:
        return '';
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center py-16 text-center space-y-3.5 ${className}`}>
      {icon || getDefaultIcon()}
      
      <div className="space-y-1 max-w-sm">
        <h3 className="text-body-lg font-semibold text-text-primary">
          {title || getDefaultTitle()}
        </h3>
        {description && (
          <p className="text-body-sm text-text-secondary leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {action && (
        <div className="pt-3">
          {action.href ? (
            <Link to={action.href}>
              <Button variant="primary" size="md">
                {action.label}
              </Button>
            </Link>
          ) : (
            <Button
              variant="primary"
              size="md"
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
