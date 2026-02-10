import { getDb } from './_shared/db.js';
import { verifyAuth } from './_shared/auth.js';
import { json, notFound, error, options } from './_shared/response.js';

export async function handler(event, context) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return options();
  }

  // Verify auth
  const auth = await verifyAuth(event);
  if (!auth.authenticated) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: auth.error || 'Unauthorized' }),
    };
  }

  const sql = getDb();
  
  // Parse path - handle both formats
  const path = event.path
    .replace(/^\/?\.netlify\/functions\/admin-course-details\/?/, '')
    .replace(/^\/?api\/admin\/courses\/?/, '');
  const segments = path.split('/').filter(Boolean);

  try {
    if (segments.length < 2) {
      return notFound('Endpoint not found');
    }

    const courseId = segments[0];
    const action = segments[1];

    // PUT /:id/trainers - Update trainers
    if (event.httpMethod === 'PUT' && action === 'trainers') {
      const { trainers } = JSON.parse(event.body);

      // Delete existing trainers
      await sql`DELETE FROM course_trainers WHERE course_id = ${courseId}`;

      // Insert new trainers
      if (trainers && trainers.length > 0) {
        for (const trainer of trainers) {
          await sql`
            INSERT INTO course_trainers (course_id, name, title, display_order)
            VALUES (${courseId}, ${trainer.name}, ${trainer.title || null}, ${trainer.display_order || 0})
          `;
        }
      }

      const updated = await sql`
        SELECT * FROM course_trainers WHERE course_id = ${courseId} ORDER BY display_order
      `;

      return json({ trainers: updated });
    }

    // PUT /:id/days - Update days
    if (event.httpMethod === 'PUT' && action === 'days') {
      const { days } = JSON.parse(event.body);

      for (const day of days) {
        if (day.id && !day.id.startsWith('new_')) {
          // Update existing day
          await sql`
            UPDATE course_days SET
              title = ${day.title || null},
              date = ${day.date || null},
              hours = ${day.hours || 0}
            WHERE id = ${day.id}
          `;
        } else {
          // Insert or update by day_number
          await sql`
            INSERT INTO course_days (course_id, day_number, title, date, hours)
            VALUES (${courseId}, ${day.day_number}, ${day.title || null}, ${day.date || null}, ${day.hours || 0})
            ON CONFLICT (course_id, day_number) 
            DO UPDATE SET title = ${day.title || null}, date = ${day.date || null}, hours = ${day.hours || 0}
          `;
        }

        // Handle questions for this day
        if (day.questions && Array.isArray(day.questions)) {
          // Get the day ID
          const dayRecords = await sql`
            SELECT id FROM course_days 
            WHERE course_id = ${courseId} AND day_number = ${day.day_number}
          `;
          
          if (dayRecords.length > 0) {
            const dayId = dayRecords[0].id;

            // Get existing question IDs
            const existingQuestions = await sql`
              SELECT id FROM survey_questions WHERE course_day_id = ${dayId}
            `;
            const existingIds = new Set(existingQuestions.map(q => q.id));

            // Process each question
            const processedIds = new Set();
            
            for (const question of day.questions) {
              if (question.id && !question.id.startsWith('new_')) {
                // Update existing question
                await sql`
                  UPDATE survey_questions SET
                    question_text = ${question.question_text},
                    question_type = ${question.question_type || 'text'},
                    options = ${question.options ? JSON.stringify(question.options) : null},
                    required = ${question.required ?? true},
                    display_order = ${question.display_order || 0}
                  WHERE id = ${question.id}
                `;
                processedIds.add(question.id);
              } else {
                // Insert new question
                await sql`
                  INSERT INTO survey_questions (
                    course_day_id, question_text, question_type, options, required, display_order
                  ) VALUES (
                    ${dayId}, ${question.question_text}, ${question.question_type || 'text'},
                    ${question.options ? JSON.stringify(question.options) : null},
                    ${question.required ?? true}, ${question.display_order || 0}
                  )
                `;
              }
            }

            // Delete questions that weren't in the update
            for (const existingId of existingIds) {
              if (!processedIds.has(existingId)) {
                await sql`DELETE FROM survey_questions WHERE id = ${existingId}`;
              }
            }
          }
        }
      }

      // Return updated days with questions
      const updated = await sql`
        SELECT cd.*,
               json_agg(
                 json_build_object(
                   'id', sq.id,
                   'question_text', sq.question_text,
                   'question_type', sq.question_type,
                   'options', sq.options,
                   'required', sq.required,
                   'display_order', sq.display_order
                 ) ORDER BY sq.display_order
               ) FILTER (WHERE sq.id IS NOT NULL) as questions
        FROM course_days cd
        LEFT JOIN survey_questions sq ON cd.id = sq.course_day_id
        WHERE cd.course_id = ${courseId}
        GROUP BY cd.id
        ORDER BY cd.day_number
      `;

      return json({ days: updated });
    }

    // GET /:id/attendance - Get attendance report
    if (event.httpMethod === 'GET' && action === 'attendance') {
      const attendees = await sql`
        SELECT 
          a.id,
          a.email,
          a.full_name,
          a.organization,
          e.id as enrollment_id,
          e.enrolled_at,
          COUNT(att.id) as days_attended,
          json_agg(
            json_build_object(
              'day_number', cd.day_number,
              'checked_in_at', att.checked_in_at
            ) ORDER BY cd.day_number
          ) FILTER (WHERE att.id IS NOT NULL) as attendance
        FROM attendees a
        JOIN enrollments e ON a.id = e.attendee_id
        LEFT JOIN attendance att ON e.id = att.enrollment_id
        LEFT JOIN course_days cd ON att.course_day_id = cd.id
        WHERE e.course_id = ${courseId}
        GROUP BY a.id, e.id
        ORDER BY a.full_name
      `;

      return json({ attendees });
    }

    // POST /:id/certificates - Generate certificates
    if (event.httpMethod === 'POST' && action === 'certificates') {
      // Get course details
      const courses = await sql`SELECT * FROM courses WHERE id = ${courseId}`;
      if (courses.length === 0) {
        return notFound('Course not found');
      }
      const course = courses[0];

      // Get all attendees with their attendance count who don't have certificates yet
      const attendees = await sql`
        SELECT 
          e.id as enrollment_id,
          a.full_name,
          a.email,
          COUNT(att.id)::int as days_attended
        FROM enrollments e
        JOIN attendees a ON e.attendee_id = a.id
        LEFT JOIN attendance att ON e.id = att.enrollment_id
        LEFT JOIN certificates cert ON e.id = cert.enrollment_id
        WHERE e.course_id = ${courseId}
          AND cert.id IS NULL
        GROUP BY e.id, a.id
      `;

      let generated = 0;
      
      for (const attendee of attendees) {
        let certType = null;
        
        // Determine certificate type based on course settings and attendance
        if (course.certificate_type === 'completion') {
          // Only completion certificates - must attend all days
          if (attendee.days_attended >= course.num_days) {
            certType = 'completion';
          }
        } else if (course.certificate_type === 'participation') {
          // Only participation certificates - must meet minimum
          if (attendee.days_attended >= course.min_days_for_participation) {
            certType = 'participation';
          }
        } else if (course.certificate_type === 'both') {
          // Both types - completion if all days, else participation if minimum met
          if (attendee.days_attended >= course.num_days) {
            certType = 'completion';
          } else if (attendee.days_attended >= course.min_days_for_participation) {
            certType = 'participation';
          }
        }

        if (certType) {
          const verificationCode = generateVerificationCode();

          await sql`
            INSERT INTO certificates (
              enrollment_id, certificate_type, verification_code, 
              days_attended, total_days
            ) VALUES (
              ${attendee.enrollment_id}, ${certType}, ${verificationCode},
              ${attendee.days_attended}, ${course.num_days}
            )
          `;
          generated++;
        }
      }

      return json({ success: true, count: generated });
    }

    // GET /:id/certificates - List certificates
    if (event.httpMethod === 'GET' && action === 'certificates') {
      const certificates = await sql`
        SELECT 
          cert.*,
          a.full_name as attendee_name,
          a.email as attendee_email
        FROM certificates cert
        JOIN enrollments e ON cert.enrollment_id = e.id
        JOIN attendees a ON e.attendee_id = a.id
        WHERE e.course_id = ${courseId}
        ORDER BY cert.issued_at DESC
      `;

      return json({ certificates });
    }

    return notFound('Endpoint not found');
  } catch (err) {
    console.error('Error in admin-course-details function:', err);
    return error('Server error: ' + err.message, 500);
  }
}

function generateVerificationCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}