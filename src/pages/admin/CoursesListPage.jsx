import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/layout';
import { Card, CardBody, Loading, Alert, Badge, Button, ConfirmModal } from '../../components/ui';
import { getAdminCourses, deleteCourse } from '../../utils/api';
import { pluralize, formatDate } from '../../utils/helpers';

export function CoursesListPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const data = await getAdminCourses();
      setCourses(data.courses || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      setDeleting(true);
      await deleteCourse(deleteId);
      setCourses(prev => prev.filter(c => c.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      alert('Failed to delete course: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <Loading text="Loading courses..." />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">
              Courses
            </h1>
            <p className="text-gray-500 mt-1">
              Manage your training courses.
            </p>
          </div>
          <Link to="/admin/courses/new" className="btn-primary">
            + New Course
          </Link>
        </div>

        {error && (
          <Alert variant="error">{error}</Alert>
        )}

        {/* Courses List */}
        {courses.length === 0 ? (
          <Card>
            <CardBody className="text-center py-12">
              <p className="text-gray-500 mb-4">No courses yet.</p>
              <Link to="/admin/courses/new" className="btn-primary">
                Create Your First Course
              </Link>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-4">
            {courses.map(course => (
              <Card key={course.id}>
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <Link
                          to={`/admin/courses/${course.id}`}
                          className="text-lg font-semibold text-gray-900 hover:text-helix-primary"
                        >
                          {course.name}
                        </Link>
                        <Badge variant={course.active ? 'success' : 'default'}>
                          {course.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500 space-x-4">
                        <span>{course.num_days} {pluralize(course.num_days, 'day')}</span>
                        <span>•</span>
                        <span>{course.attendee_count || 0} {pluralize(course.attendee_count || 0, 'attendee')}</span>
                        <span>•</span>
                        <span>Slug: <code className="text-helix-primary">{course.slug}</code></span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/admin/courses/${course.id}/attendance`}
                        className="btn-secondary btn-sm"
                      >
                        Attendance
                      </Link>
                      <Link
                        to={`/admin/courses/${course.id}`}
                        className="btn-secondary btn-sm"
                      >
                        Edit
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(course.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}

        {/* Delete Confirmation */}
        <ConfirmModal
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={handleDelete}
          title="Delete Course"
          message="Are you sure you want to delete this course? This will also delete all attendance records and certificates. This action cannot be undone."
          confirmText="Delete Course"
          variant="danger"
        />
      </div>
    </AdminLayout>
  );
}

export default CoursesListPage;
