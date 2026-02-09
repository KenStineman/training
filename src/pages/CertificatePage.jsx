import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PublicLayout } from '../components/layout';
import { CertificateView } from '../components/certificate';
import { Loading, Alert } from '../components/ui';
import { verifyCertificate } from '../utils/api';

export function CertificatePage() {
  const { code } = useParams();
  
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchCertificate() {
      try {
        setLoading(true);
        setError(null);
        const data = await verifyCertificate(code);
        setCertificate(data);
      } catch (err) {
        setError(err.message || 'Certificate not found');
      } finally {
        setLoading(false);
      }
    }

    if (code) {
      fetchCertificate();
    }
  }, [code]);

  const handleView = () => {
    window.open(`/api/certificates/${code}/pdf`, '_blank');
  };

  if (loading) {
    return (
      <PublicLayout>
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Loading text="Verifying certificate..." />
        </div>
      </PublicLayout>
    );
  }

  if (error) {
    return (
      <PublicLayout>
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Alert variant="error" title="Certificate Not Found">
            {error}
          </Alert>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="px-4 py-8 sm:py-12">
        <CertificateView
          certificate={certificate}
          onView={handleView}
        />
      </div>
    </PublicLayout>
  );
}

export default CertificatePage;