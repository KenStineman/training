import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/layout';
import { Card, CardBody, Loading, Alert, Badge } from '../../components/ui';
import { getAdminCourses } from '../../utils/api';
import { formatDate, pluralize } from '../../utils/helpers';

export function AdminDashboard() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchCourses() {
      try {
        setLoading(true);
        const data = await getAdminCourses();
        setCourses(data.courses || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, []);

  const activeCourses = courses.filter(c => c.active);
  const totalAttendees = courses.reduce((sum, c) => sum + (c.attendee_count || 0), 0);

  if (loading) {
    return (
      <AdminLayout>
        <Loading text="Loading dashboard..." />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            Overview of your training courses and attendance.
          </p>
        </div>

        {error && (
          <Alert variant="error">{error}</Alert>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card>
            <CardBody>
              <div className="text-sm text-gray-500">Total Courses</div>
              <div className="text-3xl font-bold text-gray-900">{courses.length}</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="text-sm text-gray-500">Active Courses</div>
              <div className="text-3xl font-bold text-green-600">{activeCourses.length}</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="text-sm text-gray-500">Total Attendees</div>
              <div className="text-3xl font-bold text-helix-primary">{totalAttendees}</div>
            </CardBody>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardBody>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/admin/courses/new"
                className="btn-primary"
              >
                + Create New Course
              </Link>
              <Link
                to="/admin/courses"
                className="btn-secondary"
              >
                View All Courses
              </Link>
            </div>
          </CardBody>
        </Card>

        {/* Recent Courses */}
        <Card>
          <CardBody>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Courses</h2>
            {courses.length === 0 ? (
              <p className="text-gray-500 italic">
                No courses yet.{' '}
                <Link to="/admin/courses/new" className="text-helix-primary hover:underline">
                  Create your first course
                </Link>
              </p>
            ) : (
              <div className="space-y-4">
                {courses.slice(0, 5).map(course => (
                  <Link
                    key={course.id}
                    to={`/admin/courses/${course.id}`}
                    className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{course.name}</div>
                        <div className="text-sm text-gray-500">
                          {course.num_days} {pluralize(course.num_days, 'day')} • 
                          {course.attendee_count || 0} {pluralize(course.attendee_count || 0, 'attendee')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={course.active ? 'success' : 'default'}>
                          {course.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </AdminLayout>
  );
}

export default AdminDashboard;
