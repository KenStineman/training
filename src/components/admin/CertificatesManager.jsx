import React, { useState } from 'react';
import { Button, Badge, Alert, Checkbox } from '../ui';
import { formatDateTime } from '../../utils/helpers';

export function CertificatesManager({
  certificates = [],
  eligibleCount = 0,
  onGenerate,
  onSendEmails,
  loading = false,
}) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [sendingEmails, setSendingEmails] = useState(false);

  const unsentCertificates = certificates.filter(c => !c.emailed_at);
  const sentCertificates = certificates.filter(c => c.emailed_at);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(unsentCertificates.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const handleSendEmails = async () => {
    if (selectedIds.length === 0) return;
    setSendingEmails(true);
    try {
      await onSendEmails(selectedIds);
      setSelectedIds([]);
    } finally {
      setSendingEmails(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Generate Section */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">Generate Certificates</h4>
            <p className="text-sm text-gray-500">
              {eligibleCount} attendee{eligibleCount !== 1 ? 's' : ''} eligible for certificates
            </p>
          </div>
          <Button
            onClick={onGenerate}
            loading={loading}
            disabled={eligibleCount === 0}
          >
            Generate Certificates
          </Button>
        </div>
      </div>

      {/* Unsent Certificates */}
      {unsentCertificates.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">
              Pending Email ({unsentCertificates.length})
            </h4>
            <div className="flex items-center gap-4">
              <Checkbox
                label="Select all"
                checked={selectedIds.length === unsentCertificates.length}
                onChange={handleSelectAll}
              />
              <Button
                size="sm"
                onClick={handleSendEmails}
                loading={sendingEmails}
                disabled={selectedIds.length === 0}
              >
                Send {selectedIds.length > 0 ? `(${selectedIds.length})` : ''} Emails
              </Button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg divide-y">
            {unsentCertificates.map(cert => (
              <div
                key={cert.id}
                className="flex items-center justify-between p-4 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedIds.includes(cert.id)}
                    onChange={() => handleSelect(cert.id)}
                  />
                  <div>
                    <div className="font-medium text-gray-900">
                      {cert.attendee_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {cert.attendee_email}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={cert.certificate_type === 'completion' ? 'success' : 'primary'}>
                    {cert.certificate_type === 'completion' ? 'Completion' : 'Participation'}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {cert.days_attended}/{cert.total_days} days
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sent Certificates */}
      {sentCertificates.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">
            Sent ({sentCertificates.length})
          </h4>
          <div className="bg-white border border-gray-200 rounded-lg divide-y">
            {sentCertificates.map(cert => (
              <div
                key={cert.id}
                className="flex items-center justify-between p-4"
              >
                <div>
                  <div className="font-medium text-gray-900">
                    {cert.attendee_name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {cert.attendee_email}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="success">Sent</Badge>
                  <span className="text-sm text-gray-400">
                    {formatDateTime(cert.emailed_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {certificates.length === 0 && (
        <Alert variant="info">
          No certificates have been generated yet. Generate certificates for eligible attendees above.
        </Alert>
      )}
    </div>
  );
}

export default CertificatesManager;
