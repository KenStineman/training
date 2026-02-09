import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardBody, Button, Input } from '../components/ui';
import config from '../config';

export function HomePage() {
  const [certCode, setCertCode] = useState('');
  const navigate = useNavigate();

  const logoUrl =
    (typeof process !== 'undefined' &&
      process.env &&
      process.env.LOGO_URL) ||
    '';

  const handleVerify = (e) => {
    e.preventDefault();
    // Only allow alphanumeric, strip everything else
    const sanitized = certCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (sanitized) {
      navigate(`/cert/${sanitized}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="text-center mb-12">
          {logoUrl && (
            <img
              src={logoUrl}
              alt="Double-Helix Training logo"
              className="mx-auto mb-4 h-16 object-contain"
            />
          )}

          <h1 className="text-4xl font-display font-bold text-helix-primary mb-4">
            Double-Helix Training
          </h1>

          <p className="text-lg text-gray-600">
            Technical training programs with Certificates of Completion by {config.companyName}
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Attendee Card */}
          <Card>
            <CardBody className="p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-helix-light rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-helix-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>

                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Course Attendee?
                </h2>

                <p className="text-gray-600 mb-4">
                  Scan the QR code provided by your instructor to record your attendance.
                </p>

                <p className="text-sm text-gray-500">
                  Your attendance URL will look like:{' '}
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    /attend/course-name/1
                  </code>
                </p>
              </div>
            </CardBody>
          </Card>

          {/* Verify Card */}
          <Card>
            <CardBody className="p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-helix-light rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-helix-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>

                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Verify Certificate
                </h2>

                <p className="text-gray-600 mb-4">
                  Have a Certificate of Completion? Enter the verification code below.
                </p>

                <form onSubmit={handleVerify} className="flex gap-2">
                  <Input
                    placeholder="Enter code (e.g., ABC123XYZ)"
                    value={certCode}
                    onChange={(e) => setCertCode(e.target.value)}
                    className="flex-1"
                  />

                  <Button type="submit" disabled={!certCode.trim()}>
                    Verify
                  </Button>
                </form>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Admin Link */}
        <div className="text-center mt-12">
          <Link
            to="/admin"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Administrator Login →
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-gray-500">
          <p>© {new Date().getFullYear()} {config.companyName}</p>
          <a href={config.companyUrl} className="hover:text-helix-primary">
            {config.companyUrl.replace('https://', '')}
          </a>
        </div>

      </div>
    </div>
  );
}

export default HomePage;
