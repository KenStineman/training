import { getDb } from './_shared/db.js';
import { json, notFound, error, options } from './_shared/response.js';

export async function handler(event, context) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return options();
  }

  const sql = getDb();
  const path = event.path.replace(/^\/\.netlify\/functions\/courses\/?/, '');
  const segments = path.split('/').filter(Boolean);

  try {
    // GET /courses/:slug
    if (event.httpMethod === 'GET' && segments.length === 1) {
      const slug = segments[0];
      
      const courses = await sql`
        SELECT c.*, 
               json_agg(DISTINCT jsonb_build_object(
                 'id', ct.id, 
                 'name', ct.name, 
                 'title', ct.title,
                 'display_order', ct.display_order
               )) FILTER (WHERE ct.id IS NOT NULL) as trainers
        FROM courses c
        LEFT JOIN course_trainers ct ON c.id = ct.course_id
        WHERE c.slug = ${slug} AND c.active = true
        GROUP BY c.id
      `;

      if (courses.length === 0) {
        return notFound('Course not found');
      }

      return json(courses[0]);
    }

    // GET /courses/:slug/day/:dayNumber
    if (event.httpMethod === 'GET' && segments.length === 3 && segments[1] === 'day') {
      const slug = segments[0];
      const dayNumber = parseInt(segments[2], 10);

      if (isNaN(dayNumber) || dayNumber < 1) {
        return error('Invalid day number');
      }

      // Get course
      const courses = await sql`
        SELECT c.*, 
               json_agg(DISTINCT jsonb_build_object(
                 'id', ct.id, 
                 'name', ct.name, 
                 'title', ct.title
               )) FILTER (WHERE ct.id IS NOT NULL) as trainers
        FROM courses c
        LEFT JOIN course_trainers ct ON c.id = ct.course_id
        WHERE c.slug = ${slug} AND c.active = true
        GROUP BY c.id
      `;

      if (courses.length === 0) {
        return notFound('Course not found');
      }

      const course = courses[0];

      if (dayNumber > course.num_days) {
        return notFound('Day not found');
      }

      // Get day
      const days = await sql`
        SELECT * FROM course_days 
        WHERE course_id = ${course.id} AND day_number = ${dayNumber}
      `;

      let day = days[0];
      
      // Create day entry if it doesn't exist
      if (!day) {
        const newDays = await sql`
          INSERT INTO course_days (course_id, day_number)
          VALUES (${course.id}, ${dayNumber})
          RETURNING *
        `;
        day = newDays[0];
      }

      // Get questions for this day
      const questions = await sql`
        SELECT * FROM survey_questions
        WHERE course_day_id = ${day.id}
        ORDER BY display_order
      `;

      return json({
        course,
        day,
        questions,
      });
    }

    return notFound('Endpoint not found');
  } catch (err) {
    console.error('Error in courses function:', err);
    return error('Server error: ' + err.message, 500);
  }
}
