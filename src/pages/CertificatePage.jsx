import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardBody, Loading, Alert, Button } from '../components/ui';
import { verifyCertificate } from '../utils/api';
import config from '../config';

export function CertificatePage() {
  const { code } = useParams();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (code) {
      fetchCertificate();
    } else {
      setLoading(false);
    }
  }, [code]);

  const fetchCertificate = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await verifyCertificate(code);
      setCertificate(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPDF = () => {
    window.open(`/api/certificates/${code}/pdf`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading text="Verifying certificate..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="text-helix-primary hover:text-helix-secondary">
            ← Back to Home
          </Link>
        </div>

        {error && (
          <Card>
            <CardBody className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Certificate Not Found
              </h2>
              <p className="text-gray-600">
                The verification code "{code}" was not found. Please check the code and try again.
              </p>
            </CardBody>
          </Card>
        )}

        {certificate && (
          <Card>
            <CardBody className="py-8">
              {/* Verified Badge */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-green-700">
                  Certificate Verified
                </h2>
              </div>

              {/* Certificate Details */}
              <div className="border-t border-b py-6 my-6 space-y-4">
                <div className="text-center">
                  <p className="text-sm text-gray-500 uppercase tracking-wide">Certificate of</p>
                  <p className="text-2xl font-display font-bold text-helix-primary capitalize">
                    {certificate.certificate_type}
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-500">Awarded to</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {certificate.attendee_name}
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-500">For completing</p>
                  <p className="text-lg font-medium text-gray-900">
                    {certificate.course_name}
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-500">Attendance</p>
                  <p className="text-gray-900">
                    {certificate.days_attended} of {certificate.total_days} days
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-500">Issued</p>
                  <p className="text-gray-900">
                    {new Date(certificate.issued_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-500">Verification Code</p>
                  <p className="font-mono text-gray-900">
                    {certificate.verification_code}
                  </p>
                </div>
              </div>

              {/* Trainers */}
              {certificate.trainers && certificate.trainers.length > 0 && certificate.trainers[0]?.name && (
                <div className="text-center mb-6">
                  <p className="text-sm text-gray-500">Instructor</p>
                  <p className="text-gray-900">
                    {certificate.trainers.map(t => t.name).filter(Boolean).join(', ')}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="text-center">
                <Button onClick={handleViewPDF}>
                  View PDF Certificate
                </Button>
              </div>

              {/* Issuer */}
              <div className="text-center mt-8 text-sm text-gray-500">
                <p>Issued by {config.companyName}</p>
              </div>
            </CardBody>
          </Card>
        )}

        {!code && (
          <Card>
            <CardBody className="text-center py-12">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Enter Verification Code
              </h2>
              <p className="text-gray-600">
                Please enter a certificate verification code in the URL.
              </p>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}

export default CertificatePage;