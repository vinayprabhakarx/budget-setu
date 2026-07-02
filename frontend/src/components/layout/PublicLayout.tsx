import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../shared/ThemeToggle';
import { Menu, X, ArrowRight, Globe } from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '../shared/Icons';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLoginPage = location.pathname === '/login';
  const authLinkTo = isLoginPage ? '/register' : '/login';
  const authLinkText = isLoginPage ? 'Sign Up' : 'Sign In';

  const navLinks = [
    { name: 'About', path: '/about' },
    { name: 'Pricing', path: '/pricing' },
    { name: 'Contact', path: '/contact' },
  ];

  const legalLinks = [
    { name: 'Privacy Policy', path: '/privacy' },
    { name: 'Terms of Service', path: '/terms' },
    { name: 'Cookie Policy', path: '/cookies' },
    { name: 'Data Deletion', path: '/data-deletion' },
  ];

  const handleLinkClick = (path: string) => {
    setMobileMenuOpen(false);
    if (path.startsWith('/#')) {
      const id = path.substring(2);
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="min-h-screen bg-bg-base text-text-primary flex flex-col transition-colors duration-300">
      {/* Premium Glassmorphic Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-bg-surface/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="font-display text-text-primary text-2xl md:text-3xl tracking-tight hover:opacity-90 transition-opacity flex items-center gap-2">
            <span>BudgetSetu</span>
          <span className="ml-1 text-xl font-bold text-brand font-sans" title="Beta">β</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => handleLinkClick(link.path)}
                className={`text-body-md font-medium transition-colors hover:text-brand ${location.pathname === link.path ? 'text-brand' : 'text-text-secondary'
                  }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Desktop Right Side (CTA + Theme) */}
          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            {user ? (
              <Link to="/dashboard" className="btn btn-primary btn-md flex items-center gap-2">
                <span>Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link to={authLinkTo} className="btn btn-primary btn-md">
                {authLinkText}
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1 rounded-md hover:bg-bg-subtle text-text-secondary transition-colors"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-bg-surface transition-all duration-200">
            <div className="px-6 py-4 space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => handleLinkClick(link.path)}
                  className={`block py-2 text-body-md font-medium transition-colors hover:text-brand ${location.pathname === link.path ? 'text-brand' : 'text-text-secondary'
                    }`}
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-2 border-t border-border/50">
                {user ? (
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn btn-primary w-full py-2.5 flex items-center justify-center gap-2"
                  >
                    <span>Dashboard</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <Link
                    to={authLinkTo}
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn btn-primary w-full py-2.5 text-center"
                  >
                    {authLinkText}
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Page Content */}
      <main className="flex-grow flex flex-col min-h-[calc(100vh-4rem)]">
        {children}
      </main>

      {/* Structured Corporate Footer */}
      <footer className="bg-bg-surface border-t border-border mt-auto py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-10 lg:gap-10">
          {/* Column 1: Brand & Description */}
          <div className="space-y-4 col-span-2 md:col-span-2">
            <Link to="/" className="flex items-center gap-2">
              <span className="font-display text-text-primary text-2xl md:text-3xl tracking-tight">BudgetSetu</span>
              <span className="ml-1 text-xl font-bold text-brand font-sans" title="Beta">β</span>
            </Link>
            <p className="text-text-secondary text-body-sm max-w-xs leading-relaxed">
              Premium personal finance and transaction statement intelligence. Track, budget, and analyze with absolute clarity and privacy.
            </p>
          </div>

          {/* Column 2: Navigation Links */}
          <div className="space-y-4 col-span-1">
            <h4 className="text-text-primary text-body-md font-semibold tracking-tight">App Pages</h4>
            <ul className="space-y-2.5">
              {navLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    onClick={() => handleLinkClick(link.path)}
                    className="text-text-secondary hover:text-brand text-body-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Legal & Compliance */}
          <div className="space-y-4 col-span-1">
            <h4 className="text-text-primary text-body-md font-semibold tracking-tight">Legal & Compliance</h4>
            <ul className="space-y-2.5">
              {legalLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-text-secondary hover:text-brand text-body-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom copyright and socials bar */}
        <div className="max-w-7xl mx-auto px-6 pt-8 mt-10 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-text-muted text-body-sm">
          <span>© {new Date().getFullYear()} BudgetSetu. All rights reserved.</span>
          <div className="flex gap-4 items-center">
            <a href="https://github.com/vinayprabhakarx" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-brand transition-colors" aria-label="GitHub">
              <GithubIcon size={18} />
            </a>
            <a href="https://linkedin.com/in/vinayprabhakarx" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-brand transition-colors" aria-label="LinkedIn">
              <LinkedinIcon size={18} />
            </a>
            <a href="https://vinayprabhakar.dev" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-brand transition-colors" aria-label="Website">
              <Globe size={18} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
