import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AdminLayout } from '../../components/layout';
import { AttendanceTable } from '../../components/admin';
import { Card, CardBody, Loading, Alert } from '../../components/ui';
import { getAdminCourse, getAttendanceReport } from '../../utils/api';
import { percentage } from '../../utils/helpers';

export function AttendancePage() {
  const { id } = useParams();

  const [course, setCourse] = useState(null);
  const [days, setDays] = useState([]);
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [courseData, reportData] = await Promise.all([
          getAdminCourse(id),
          getAttendanceReport(id),
        ]);
        setCourse(courseData.course);
        setDays(courseData.days || []);
        setAttendees(reportData.attendees || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <AdminLayout>
        <Loading text="Loading attendance data..." />
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <Alert variant="error">{error}</Alert>
      </AdminLayout>
    );
  }

  // ✅ FIXED: derive attendance from attendance array
  const completedCount = attendees.filter(
    a => (a.attendance?.length || 0) === course.num_days
  ).length;

  const partialCount = attendees.filter(
    a => {
      const attended = a.attendance?.length || 0;
      return attended > 0 && attended < course.num_days;
    }
  ).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Link
            to={`/admin/courses/${id}`}
            className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
          >
            ← Back to {course.name}
          </Link>

          <h1 className="text-2xl font-display font-bold text-gray-900">
            Attendance Report
          </h1>

          <p className="text-gray-500">{course.name}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardBody className="text-center">
              <div className="text-2xl font-bold text-gray-900">{attendees.length}</div>
              <div className="text-sm text-gray-500">Total Attendees</div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="text-center">
              <div className="text-2xl font-bold text-green-600">{completedCount}</div>
              <div className="text-sm text-gray-500">Completed All Days</div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{partialCount}</div>
              <div className="text-sm text-gray-500">Partial Attendance</div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="text-center">
              <div className="text-2xl font-bold text-helix-primary">
                {attendees.length > 0
                  ? percentage(completedCount, attendees.length)
                  : 0}
                %
              </div>
              <div className="text-sm text-gray-500">Completion Rate</div>
            </CardBody>
          </Card>
        </div>

        {/* Attendance Table */}
        <Card>
          <CardBody className="p-0">
            <AttendanceTable
              attendees={attendees}
              days={days}
              course={course}
            />
          </CardBody>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link
            to={`/admin/courses/${id}/certificates`}
            className="btn-primary"
          >
            Manage Certificates →
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AttendancePage;
