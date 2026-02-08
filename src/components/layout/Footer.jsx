import React from 'react';
import config from '../../config';

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">
            © {currentYear} {config.companyName}. All rights reserved.
          </p>
          <div className="flex items-center space-x-6">
            <a
              href={config.companyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:text-helix-primary transition-colors"
            >
              Website
            </a>
            <a
              href={`mailto:${config.supportEmail}`}
              className="text-sm text-gray-500 hover:text-helix-primary transition-colors"
            >
              Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
