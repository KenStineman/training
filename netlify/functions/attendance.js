import { getDb } from './_shared/db.js';
import { json, error, notFound, options } from './_shared/response.js';

export async function handler(event, context) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return options();
  }

  if (event.httpMethod !== 'POST') {
    return error('Method not allowed', 405);
  }

  const sql = getDb();

  try {
    const body = JSON.parse(event.body);
    const { courseSlug, dayNumber, email, fullName, organization, responses } = body;

    // Validate required fields
    if (!courseSlug || !dayNumber || !email || !fullName) {
      return error('Missing required fields: courseSlug, dayNumber, email, fullName');
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return error('Invalid email address');
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Get course
    const courses = await sql`
      SELECT * FROM courses WHERE slug = ${courseSlug} AND active = true
    `;

    if (courses.length === 0) {
      return notFound('Course not found');
    }

    const course = courses[0];

    if (dayNumber > course.num_days || dayNumber < 1) {
      return notFound('Invalid day number');
    }

    // Get or create course day
    let days = await sql`
      SELECT * FROM course_days 
      WHERE course_id = ${course.id} AND day_number = ${dayNumber}
    `;

    let day;
    if (days.length === 0) {
      const newDays = await sql`
        INSERT INTO course_days (course_id, day_number)
        VALUES (${course.id}, ${dayNumber})
        RETURNING *
      `;
      day = newDays[0];
    } else {
      day = days[0];
    }

    // Get or create attendee
    let attendees = await sql`
      SELECT * FROM attendees WHERE email = ${normalizedEmail}
    `;

    let attendee;
    if (attendees.length === 0) {
      const newAttendees = await sql`
        INSERT INTO attendees (email, full_name, organization)
        VALUES (${normalizedEmail}, ${fullName.trim()}, ${organization?.trim() || null})
        RETURNING *
      `;
      attendee = newAttendees[0];
    } else {
      attendee = attendees[0];
      // Update name if different
      if (attendee.full_name !== fullName.trim()) {
        await sql`
          UPDATE attendees 
          SET full_name = ${fullName.trim()}, 
              organization = COALESCE(${organization?.trim()}, organization)
          WHERE id = ${attendee.id}
        `;
      }
    }

    // Get or create enrollment
    let enrollments = await sql`
      SELECT * FROM enrollments 
      WHERE attendee_id = ${attendee.id} AND course_id = ${course.id}
    `;

    let enrollment;
    if (enrollments.length === 0) {
      const newEnrollments = await sql`
        INSERT INTO enrollments (attendee_id, course_id)
        VALUES (${attendee.id}, ${course.id})
        RETURNING *
      `;
      enrollment = newEnrollments[0];
    } else {
      enrollment = enrollments[0];
    }

    // Check if already checked in for this day
    const existingAttendance = await sql`
      SELECT * FROM attendance 
      WHERE enrollment_id = ${enrollment.id} AND course_day_id = ${day.id}
    `;

    if (existingAttendance.length > 0) {
      return error('You have already checked in for this day', 409);
    }

    // Record attendance
    const attendanceRecords = await sql`
      INSERT INTO attendance (enrollment_id, course_day_id)
      VALUES (${enrollment.id}, ${day.id})
      RETURNING *
    `;

    const attendance = attendanceRecords[0];

    // Save survey responses
    if (responses && Object.keys(responses).length > 0) {
      for (const [questionId, responseValue] of Object.entries(responses)) {
        if (responseValue) {
          await sql`
            INSERT INTO survey_responses (attendance_id, question_id, response_value)
            VALUES (${attendance.id}, ${questionId}, ${String(responseValue)})
            ON CONFLICT (attendance_id, question_id) 
            DO UPDATE SET response_value = ${String(responseValue)}
          `;
        }
      }
    }

    return json({
      success: true,
      message: 'Attendance recorded successfully',
      attendance: {
        dayNumber,
        checkedInAt: attendance.checked_in_at,
      },
    });
  } catch (err) {
    console.error('Error recording attendance:', err);
    return error('Failed to record attendance: ' + err.message, 500);
  }
}
