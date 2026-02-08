// API utility functions

import config from '../config';

const API_BASE = config.apiBaseUrl;

/**
 * Make an API request
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };
  
  // Add auth token if available
  const user = getNetlifyUser();
  if (user?.token?.access_token) {
    defaultHeaders['Authorization'] = `Bearer ${user.token.access_token}`;
  }
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });
  
  // Handle non-JSON responses
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/pdf')) {
    if (!response.ok) {
      throw new Error('Failed to download PDF');
    }
    return response.blob();
  }
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'An error occurred');
  }
  
  return data;
}

/**
 * Get the current Netlify Identity user
 */
function getNetlifyUser() {
  if (typeof window !== 'undefined' && window.netlifyIdentity) {
    return window.netlifyIdentity.currentUser();
  }
  return null;
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Get public course info by slug
 */
export async function getCourse(slug) {
  return request(`/courses/${slug}`);
}

/**
 * Get course day info with survey questions
 */
export async function getCourseDay(slug, dayNumber) {
  return request(`/courses/${slug}/day/${dayNumber}`);
}

/**
 * Submit attendance and survey responses
 */
export async function submitAttendance(data) {
  return request('/attendance', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Verify a certificate by code
 */
export async function verifyCertificate(code) {
  return request(`/certificates/${code}`);
}

/**
 * Download certificate PDF
 */
export async function downloadCertificate(code) {
  return request(`/certificates/${code}/pdf`);
}

// ============================================================================
// ADMIN API
// ============================================================================

/**
 * Get all courses (admin)
 */
export async function getAdminCourses() {
  return request('/admin/courses');
}

/**
 * Get single course with full details (admin)
 */
export async function getAdminCourse(id) {
  return request(`/admin/courses/${id}`);
}

/**
 * Create a new course
 */
export async function createCourse(data) {
  return request('/admin/courses', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update a course
 */
export async function updateCourse(id, data) {
  return request(`/admin/courses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete a course
 */
export async function deleteCourse(id) {
  return request(`/admin/courses/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Update course days
 */
export async function updateCourseDays(courseId, days) {
  return request(`/admin/courses/${courseId}/days`, {
    method: 'PUT',
    body: JSON.stringify({ days }),
  });
}

/**
 * Update course trainers
 */
export async function updateCourseTrainers(courseId, trainers) {
  return request(`/admin/courses/${courseId}/trainers`, {
    method: 'PUT',
    body: JSON.stringify({ trainers }),
  });
}

/**
 * Update survey questions for a day
 */
export async function updateSurveyQuestions(courseId, dayId, questions) {
  return request(`/admin/courses/${courseId}/days/${dayId}/questions`, {
    method: 'PUT',
    body: JSON.stringify({ questions }),
  });
}

/**
 * Get attendance report for a course
 */
export async function getAttendanceReport(courseId) {
  return request(`/admin/courses/${courseId}/attendance`);
}

/**
 * Generate certificates for a course
 */
export async function generateCertificates(courseId, options = {}) {
  return request(`/admin/courses/${courseId}/certificates`, {
    method: 'POST',
    body: JSON.stringify(options),
  });
}

/**
 * Send certificate emails
 */
export async function sendCertificateEmails(certificateIds) {
  return request('/admin/certificates/send', {
    method: 'POST',
    body: JSON.stringify({ certificateIds }),
  });
}

/**
 * Get certificate list for a course
 */
export async function getCourseCertificates(courseId) {
  return request(`/admin/courses/${courseId}/certificates`);
}

export default {
  getCourse,
  getCourseDay,
  submitAttendance,
  verifyCertificate,
  downloadCertificate,
  getAdminCourses,
  getAdminCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  updateCourseDays,
  updateCourseTrainers,
  updateSurveyQuestions,
  getAttendanceReport,
  generateCertificates,
  sendCertificateEmails,
  getCourseCertificates,
};
