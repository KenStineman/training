import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PublicLayout } from '../components/layout';
import { CertificateView } from '../components/certificate';
import { Loading, Alert } from '../components/ui';
import { verifyCertificate, downloadCertificate } from '../utils/api';
import { downloadBlob } from '../utils/helpers';

export function CertificatePage() {
  const { code } = useParams();
  
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

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

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const blob = await downloadCertificate(code);
      const filename = `certificate-${code}.pdf`;
      downloadBlob(blob, filename);
    } catch (err) {
      alert('Failed to download certificate. Please try again.');
    } finally {
      setDownloading(false);
    }
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
          onDownload={handleDownload}
          loading={downloading}
        />
      </div>
    </PublicLayout>
  );
}

export default CertificatePage;
