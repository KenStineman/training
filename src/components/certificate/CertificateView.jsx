import React from 'react';
import { Button, Badge, Alert } from '../ui';
import { formatDate } from '../../utils/helpers';
import config from '../../config';

export function CertificateView({
  certificate,
  onDownload,
  loading = false,
}) {
  if (!certificate) {
    return (
      <Alert variant="error">
        Certificate not found or invalid verification code.
      </Alert>
    );
  }

  const isCompletion = certificate.certificate_type === 'completion';

  return (
    <div className="max-w-2xl mx-auto">
      {/* Certificate Preview Card */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-helix-primary/20 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-helix-primary to-helix-secondary p-6 text-white text-center">
          <img
            src={certificate.logo_url || config.defaultLogoUrl}
            alt="Logo"
            className="h-12 mx-auto mb-4"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <h1 className="text-2xl font-display font-bold">
            Certificate of {isCompletion ? 'Completion' : 'Participation'}
          </h1>
        </div>

        {/* Body */}
        <div className="p-8 text-center">
          <p className="text-gray-600 mb-2">This certifies that</p>
          <h2 className="text-3xl font-display font-bold text-gray-900 mb-4">
            {certificate.attendee_name}
          </h2>
          
          <p className="text-gray-600 mb-2">
            has successfully {isCompletion ? 'completed' : 'participated in'}
          </p>
          <h3 className="text-xl font-semibold text-helix-primary mb-4">
            {certificate.course_name}
          </h3>

          <div className="flex justify-center gap-8 text-sm text-gray-500 mb-6">
            <div>
              <span className="block text-gray-400">Days Attended</span>
              <span className="font-medium text-gray-900">
                {certificate.days_attended} of {certificate.total_days}
              </span>
            </div>
            <div>
              <span className="block text-gray-400">Issue Date</span>
              <span className="font-medium text-gray-900">
                {formatDate(certificate.issued_at)}
              </span>
            </div>
          </div>

          {certificate.trainers && certificate.trainers.length > 0 && (
            <div className="border-t border-gray-100 pt-4 mt-4">
              <p className="text-sm text-gray-500 mb-1">Instructor</p>
              <p className="font-medium text-gray-900">
                {certificate.trainers.map(t => t.name).join(', ')}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-4 flex justify-between items-center text-sm">
          <div className="text-gray-500">
            Verification Code: <code className="font-mono">{certificate.verification_code}</code>
          </div>
          <Badge variant={isCompletion ? 'success' : 'primary'}>
            Verified
          </Badge>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 text-center">
        <Button onClick={onDownload} loading={loading} size="lg">
          Download PDF Certificate
        </Button>
        <p className="mt-4 text-sm text-gray-500">
          This certificate was issued by{' '}
          <a
            href={config.companyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-helix-primary hover:underline"
          >
            {config.companyName}
          </a>
        </p>
      </div>
    </div>
  );
}

export default CertificateView;
