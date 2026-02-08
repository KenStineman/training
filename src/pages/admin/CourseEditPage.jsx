import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AdminLayout } from '../../components/layout';
import { CourseForm, TrainersEditor, DaysEditor } from '../../components/admin';
import { Card, CardBody, CardHeader, CardTitle, Loading, Alert, Button } from '../../components/ui';
import { getAdminCourse, createCourse, updateCourse, updateCourseTrainers, updateCourseDays } from '../../utils/api';

export function CourseEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [course, setCourse] = useState(null);
  const [trainers, setTrainers] = useState([]);
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    if (!isNew && id) {
      fetchCourse();
    }
  }, [id, isNew]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const data = await getAdminCourse(id);
      setCourse(data.course);
      setTrainers(data.trainers || []);
      setDays(data.days || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCourse = async (formData) => {
    try {
      setSaving(true);
      setError(null);

      if (isNew) {
        const result = await createCourse(formData);
        navigate(`/admin/courses/${result.course.id}`);
      } else {
        await updateCourse(id, formData);
        await fetchCourse();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTrainers = async () => {
    try {
      setSaving(true);
      setError(null);
      await updateCourseTrainers(id, trainers);
      await fetchCourse();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDays = async () => {
    try {
      setSaving(true);
      setError(null);
      await updateCourseDays(id, days);
      await fetchCourse();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <Loading text="Loading course..." />
      </AdminLayout>
    );
  }

  const tabs = [
    { id: 'details', label: 'Course Details' },
    { id: 'trainers', label: 'Trainers' },
    { id: 'days', label: 'Days & Surveys' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link
              to="/admin/courses"
              className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
            >
              ← Back to Courses
            </Link>
            <h1 className="text-2xl font-display font-bold text-gray-900">
              {isNew ? 'Create New Course' : course?.name || 'Edit Course'}
            </h1>
          </div>
          {!isNew && course && (
            <div className="flex gap-2">
              <Link
                to={`/admin/courses/${id}/attendance`}
                className="btn-secondary"
              >
                View Attendance
              </Link>
              <Link
                to={`/admin/courses/${id}/certificates`}
                className="btn-secondary"
              >
                Certificates
              </Link>
            </div>
          )}
        </div>

        {error && (
          <Alert variant="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Tabs (only for existing courses) */}
        {!isNew && (
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors
                    ${activeTab === tab.id
                      ? 'border-helix-primary text-helix-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        )}

        {/* Content */}
        <Card>
          <CardBody>
            {(isNew || activeTab === 'details') && (
              <CourseForm
                initialData={course}
                onSubmit={handleSaveCourse}
                onCancel={() => navigate('/admin/courses')}
                loading={saving}
                error={null}
              />
            )}

            {!isNew && activeTab === 'trainers' && (
              <div className="space-y-6">
                <TrainersEditor
                  trainers={trainers}
                  onChange={setTrainers}
                />
                <div className="flex justify-end pt-4 border-t">
                  <Button onClick={handleSaveTrainers} loading={saving}>
                    Save Trainers
                  </Button>
                </div>
              </div>
            )}

            {!isNew && activeTab === 'days' && (
              <div className="space-y-6">
                <DaysEditor
                  days={days}
                  onChange={setDays}
                  numDays={course?.num_days || 1}
                />
                <div className="flex justify-end pt-4 border-t">
                  <Button onClick={handleSaveDays} loading={saving}>
                    Save Days & Questions
                  </Button>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Attendance URL Preview */}
        {!isNew && course && (
          <Card>
            <CardBody>
              <h3 className="font-medium text-gray-900 mb-2">Attendance URLs</h3>
              <p className="text-sm text-gray-500 mb-3">
                Share these URLs or generate QR codes for attendees to check in:
              </p>
              <div className="space-y-2 font-mono text-sm">
                {Array.from({ length: course.num_days }, (_, i) => i + 1).map(dayNum => (
                  <div key={dayNum} className="p-2 bg-gray-50 rounded">
                    <span className="text-gray-500">Day {dayNum}:</span>{' '}
                    <code className="text-helix-primary">
                      {window.location.origin}/training/attend/{course.slug}/{dayNum}
                    </code>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}

export default CourseEditPage;
