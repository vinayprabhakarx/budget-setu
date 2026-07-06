import React from 'react';
import googleIcon from '../../assets/google.svg';

interface GoogleLogoProps {
  className?: string;
  size?: number;
}

export const GoogleLogo: React.FC<GoogleLogoProps> = ({ className = 'h-5 w-5', size }) => (
  <img
    src={googleIcon}
    alt="Google"
    className={className}
    {...(size ? { width: size, height: size } : {})}
  />
);
