import React from 'react';
import { Link } from 'react-router-dom';
import config from '../../config';

export function Header({ showNav = true }) {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <img
              src={config.defaultLogoUrl}
              alt={config.companyName}
              className="h-8 w-auto"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <span className="font-display font-semibold text-xl text-helix-primary">
              {config.appName}
            </span>
          </Link>
          
          {/* Navigation */}
          {showNav && (
            <nav className="flex items-center space-x-4">
              <a
                href={config.companyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-helix-primary transition-colors"
              >
                {config.companyName}
              </a>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
