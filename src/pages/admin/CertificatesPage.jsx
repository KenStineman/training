import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AdminLayout } from '../../components/layout';
import { Card, CardBody, Button, Loading, Alert, Badge } from '../../components/ui';
import { getAdminCourse, getCourseCertificates, generateCertificates, sendCertificateEmails } from '../../utils/api';

export function CertificatesPage() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selected, setSelected] = useState(new Set());

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [courseData, certsData] = await Promise.all([
        getAdminCourse(id),
        getCourseCertificates(id),
      ]);
      setCourse(courseData.course);
      setCertificates(certsData.certificates || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setError(null);
      const result = await generateCertificates(id);
      setSuccess(`Generated ${result.count} certificate(s)`);
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSendEmails = async () => {
    if (selected.size === 0) return;

    try {
      setSending(true);
      setError(null);
      const result = await sendCertificateEmails(Array.from(selected));
      setSuccess(`Sent ${result.sent} email(s)`);
      setSelected(new Set());
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const toggleSelect = (certId) => {
    const newSelected = new Set(selected);
    if (newSelected.has(certId)) {
      newSelected.delete(certId);
    } else {
      newSelected.add(certId);
    }
    setSelected(newSelected);
  };

  if (loading) {
    return (
      <AdminLayout>
        <Loading text="Loading certificates..." />
      </AdminLayout>
    );
  }

  const unsentCertificates = certificates.filter(c => !c.emailed_at);
  const sentCertificates = certificates.filter(c => c.emailed_at);

  const toggleSelectAll = () => {
    if (selected.size === unsentCertificates.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(unsentCertificates.map(c => c.id)));
    }
  };

  const getEligibilityText = () => {
    if (!course) return '';
    
    if (course.certificate_type === 'completion') {
      return `Attendees who complete all ${course.num_days} days are eligible for completion certificates.`;
    } else if (course.certificate_type === 'participation') {
      return `Attendees who attend at least ${course.min_days_for_participation} day(s) are eligible for participation certificates.`;
    } else {
      return `Attendees who complete all ${course.num_days} days get completion certificates. Those who attend at least ${course.min_days_for_participation} day(s) get participation certificates.`;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <Link
            to={`/admin/courses/${id}`}
            className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
          >
            ← Back to {course?.name}
          </Link>
          <h1 className="text-2xl font-display font-bold text-gray-900">
            Certificates
          </h1>
          <p className="text-gray-600">{course?.name}</p>
        </div>

        {error && (
          <Alert variant="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <Card>
          <CardBody>
            <h2 className="text-lg font-semibold mb-4">Generate Certificates</h2>
            <p className="text-gray-600 mb-4">{getEligibilityText()}</p>
            <Button onClick={handleGenerate} loading={generating}>
              Generate Certificates
            </Button>
          </CardBody>
        </Card>

        {unsentCertificates.length > 0 && (
          <Card>
            <CardBody>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">
                  Ready to Send ({unsentCertificates.length})
                </h2>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={toggleSelectAll}>
                    {selected.size === unsentCertificates.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  <Button
                    onClick={handleSendEmails}
                    loading={sending}
                    disabled={selected.size === 0}
                  >
                    Send Emails ({selected.size})
                  </Button>
                </div>
              </div>

              <div className="divide-y">
                {unsentCertificates.map(cert => (
                  <div
                    key={cert.id}
                    className="py-3 flex items-center justify-between"
                  >
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selected.has(cert.id)}
                        onChange={() => toggleSelect(cert.id)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <div>
                        <p className="font-medium">{cert.attendee_name}</p>
                        <p className="text-sm text-gray-500">{cert.attendee_email}</p>
                      </div>
                    </label>
                    <div className="flex items-center gap-3">
                      <Badge variant={cert.certificate_type === 'completion' ? 'success' : 'info'}>
                        {cert.certificate_type}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {cert.days_attended}/{cert.total_days} days
                      </span>

                      <a
                        href={`/cert/${cert.verification_code}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-helix-primary hover:underline"
                      >
                        Preview
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {sentCertificates.length > 0 && (
          <Card>
            <CardBody>
              <h2 className="text-lg font-semibold mb-4">
                Sent ({sentCertificates.length})
              </h2>

              <div className="divide-y">
                {sentCertificates.map(cert => (
                  <div
                    key={cert.id}
                    className="py-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">{cert.attendee_name}</p>
                      <p className="text-sm text-gray-500">{cert.attendee_email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={cert.certificate_type === 'completion' ? 'success' : 'info'}>
                        {cert.certificate_type}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        Sent {new Date(cert.emailed_at).toLocaleDateString()}
                      </span>

                      <a
                        href={`/cert/${cert.verification_code}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-helix-primary hover:underline"
                      >
                        View
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {certificates.length === 0 && (
          <Card>
            <CardBody className="text-center py-8">
              <p className="text-gray-500 mb-4">
                No certificates have been generated yet.
              </p>
              <p className="text-sm text-gray-400">
                {getEligibilityText()}
              </p>
            </CardBody>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}

export default CertificatesPage;
