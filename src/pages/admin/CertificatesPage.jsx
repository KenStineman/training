import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AdminLayout } from '../../components/layout';
import { CertificatesManager } from '../../components/admin';
import { Card, CardBody, Loading, Alert } from '../../components/ui';
import { 
  getAdminCourse, 
  getAttendanceReport, 
  getCourseCertificates,
  generateCertificates, 
  sendCertificateEmails 
} from '../../utils/api';

export function CertificatesPage() {
  const { id } = useParams();
  
  const [course, setCourse] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [eligibleCount, setEligibleCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [courseData, reportData, certsData] = await Promise.all([
        getAdminCourse(id),
        getAttendanceReport(id),
        getCourseCertificates(id),
      ]);
      
      setCourse(courseData.course);
      setCertificates(certsData.certificates || []);
      
      // Calculate eligible attendees (completed all days, no certificate yet)
      const completedAttendees = (reportData.attendees || []).filter(
        a => a.days_attended === courseData.course.num_days
      );
      const issuedIds = new Set((certsData.certificates || []).map(c => c.enrollment_id));
      const eligible = completedAttendees.filter(a => !issuedIds.has(a.enrollment_id));
      setEligibleCount(eligible.length);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setError(null);
      setSuccess(null);
      
      const result = await generateCertificates(id);
      setSuccess(`Generated ${result.count} certificate(s)`);
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSendEmails = async (certificateIds) => {
    try {
      setError(null);
      setSuccess(null);
      
      const result = await sendCertificateEmails(certificateIds);
      setSuccess(`Sent ${result.sent} email(s)`);
      await fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <Loading text="Loading certificates..." />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
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
          <p className="text-gray-500">{course?.name}</p>
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

        {/* Certificates Manager */}
        <Card>
          <CardBody>
            <CertificatesManager
              certificates={certificates}
              eligibleCount={eligibleCount}
              onGenerate={handleGenerate}
              onSendEmails={handleSendEmails}
              loading={generating}
            />
          </CardBody>
        </Card>

        {/* Info */}
        <Card>
          <CardBody>
            <h3 className="font-medium text-gray-900 mb-2">How it works</h3>
            <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
              <li>Attendees who complete all {course?.num_days} days become eligible for certificates</li>
              <li>Click "Generate Certificates" to create certificates for all eligible attendees</li>
              <li>Select certificates and click "Send Emails" to email download links</li>
              <li>Recipients receive an email with a link to view and download their certificate</li>
            </ol>
          </CardBody>
        </Card>
      </div>
    </AdminLayout>
  );
}

export default CertificatesPage;
