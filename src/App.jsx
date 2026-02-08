import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { initNetlifyIdentity } from './utils/auth';
import { Loading } from './components/ui';

// Pages
import {
  HomePage,
  AttendPage,
  CertificatePage,
  LoginPage,
  AdminDashboard,
  CoursesListPage,
  CourseEditPage,
  AttendancePage,
  CertificatesPage,
} from './pages';

// Protected Route wrapper
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading text="Checking authentication..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

function App() {
  useEffect(() => {
    initNetlifyIdentity();
  }, []);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/attend/:slug/:day" element={<AttendPage />} />
      <Route path="/cert/:code" element={<CertificatePage />} />

      {/* Admin Routes */}
      <Route path="/admin/login" element={<LoginPage />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/courses"
        element={
          <ProtectedRoute>
            <CoursesListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/courses/new"
        element={
          <ProtectedRoute>
            <CourseEditPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/courses/:id"
        element={
          <ProtectedRoute>
            <CourseEditPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/courses/:id/attendance"
        element={
          <ProtectedRoute>
            <AttendancePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/courses/:id/certificates"
        element={
          <ProtectedRoute>
            <CertificatesPage />
          </ProtectedRoute>
        }
      />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
