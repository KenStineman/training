import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PublicLayout } from '../components/layout';
import { AttendanceForm, SuccessMessage } from '../components/attendance';
import { Loading, Alert, Card, CardBody } from '../components/ui';
import { getCourseDay, submitAttendance } from '../utils/api';
import config from '../config';

export function AttendPage() {
  const { slug, day } = useParams();
  const dayNumber = parseInt(day, 10);

  const [courseData, setCourseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [attendeeName, setAttendeeName] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const data = await getCourseDay(slug, dayNumber);
        setCourseData(data);
      } catch (err) {
        setError(err.message || 'Failed to load course information');
      } finally {
        setLoading(false);
      }
    }

    if (slug && dayNumber) {
      fetchData();
    }
  }, [slug, dayNumber]);

  const handleSubmit = async (formData) => {
    try {
      setSubmitting(true);
      setSubmitError(null);
      
      await submitAttendance({
        courseSlug: slug,
        dayNumber: dayNumber,
        email: formData.email,
        fullName: formData.fullName,
        organization: formData.organization,
        responses: formData.responses,
      });

      setAttendeeName(formData.fullName);
      setSuccess(true);
    } catch (err) {
      setSubmitError(err.message || 'Failed to record attendance');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PublicLayout>
        <div className="max-w-lg mx-auto px-4 py-12">
          <Loading text="Loading course information..." />
        </div>
      </PublicLayout>
    );
  }

  if (error) {
    return (
      <PublicLayout>
        <div className="max-w-lg mx-auto px-4 py-12">
          <Alert variant="error" title="Unable to Load">
            {error}
          </Alert>
        </div>
      </PublicLayout>
    );
  }

  const { course, day: dayData, questions } = courseData;
  const isLastDay = dayNumber === course.num_days;

  return (
    <PublicLayout>
      <div className="max-w-lg mx-auto px-4 py-8 sm:py-12">
        {/* Course Header */}
        <div className="text-center mb-8">
          <img
            src={course.logo_url || config.defaultLogoUrl}
            alt={config.companyName}
            className="h-10 mx-auto mb-4"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <h1 className="text-2xl font-display font-bold text-gray-900 mb-2">
            {course.name}
          </h1>
          <div className="inline-flex items-center px-3 py-1 bg-helix-light text-helix-primary 
                          rounded-full text-sm font-medium">
            Day {dayNumber} of {course.num_days}
            {dayData.title && ` — ${dayData.title}`}
          </div>
        </div>

        {/* Form or Success */}
        <Card className="animate-slide-up">
          <CardBody>
            {success ? (
              <SuccessMessage
                course={course}
                day={dayData}
                attendeeName={attendeeName}
                isLastDay={isLastDay}
              />
            ) : (
              <>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Record Your Attendance
                </h2>
                <AttendanceForm
                  course={course}
                  day={dayData}
                  questions={questions}
                  onSubmit={handleSubmit}
                  loading={submitting}
                  error={submitError}
                />
              </>
            )}
          </CardBody>
        </Card>

        {/* Course Info */}
        {!success && course.trainers && course.trainers.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-500">
            Instructor: {course.trainers.map(t => t.name).join(', ')}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}

export default AttendPage;
