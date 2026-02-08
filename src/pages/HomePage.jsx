import React from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '../components/layout';
import config from '../config';

export function HomePage() {
  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 py-16 sm:py-24">
        <div className="text-center">
          {/* Logo */}
          <img
            src={config.defaultLogoUrl}
            alt={config.companyName}
            className="h-16 mx-auto mb-8"
            onError={(e) => { e.target.style.display = 'none'; }}
          />

          {/* Hero */}
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-gray-900 mb-6">
            {config.appName}
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Professional training courses with attendance tracking and certification 
            from {config.companyName}.
          </p>

          {/* Cards */}
          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Attendee Card */}
            <div className="card p-6 text-left">
              <div className="w-12 h-12 bg-helix-light rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-helix-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Course Attendee?
              </h2>
              <p className="text-gray-600 mb-4">
                Scan the QR code provided by your instructor to record your attendance.
              </p>
              <p className="text-sm text-gray-500">
                Your attendance URL will look like:
                <br />
                <code className="text-helix-primary">
                  /training/attend/course-name/1
                </code>
              </p>
            </div>

            {/* Verify Card */}
            <div className="card p-6 text-left">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Verify Certificate
              </h2>
              <p className="text-gray-600 mb-4">
                Have a certificate? Verify its authenticity using the verification code.
              </p>
              <p className="text-sm text-gray-500">
                Certificate verification URL:
                <br />
                <code className="text-helix-primary">
                  /training/cert/ABC123XYZ
                </code>
              </p>
            </div>
          </div>

          {/* Admin Link */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <Link
              to="/admin"
              className="text-sm text-gray-500 hover:text-helix-primary transition-colors"
            >
              Administrator Login →
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

export default HomePage;
