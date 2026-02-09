import { getDb } from './_shared/db.js';
import { verifyAuth } from './_shared/auth.js';
import { json, notFound, error, options } from './_shared/response.js';

async function handler(event, context) {
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
  
  // Parse the path - handle both /api/admin/courses/... and /.netlify/functions/admin-courses/...
  const path = event.path
    .replace(/^\/?\.netlify\/functions\/admin-courses\/?/, '')
    .replace(/^\/?api\/admin\/courses\/?/, '');
  const segments = path.split('/').filter(Boolean);

  try {
    // GET /admin/courses - List all courses
    if (event.httpMethod === 'GET' && segments.length === 0) {
      const courses = await sql`
        SELECT c.*,
               COUNT(DISTINCT e.id) as attendee_count
        FROM courses c
        LEFT JOIN enrollments e ON c.id = e.course_id
        GROUP BY c.id
        ORDER BY c.created_at DESC
      `;

      return json({ courses });
    }

    // POST /admin/courses - Create new course
    if (event.httpMethod === 'POST' && segments.length === 0) {
      const body = JSON.parse(event.body);
      const {
        name,
        slug,
        description,
        num_days,
        certificate_type,
        min_days_for_participation,
        requires_all_days_for_completion,
        certificate_template,
        logo_url,
        default_organization,
        active,
      } = body;

      if (!name || !slug) {
        return error('Name and slug are required');
      }

      // Check slug uniqueness
      const existing = await sql`SELECT id FROM courses WHERE slug = ${slug}`;
      if (existing.length > 0) {
        return error('A course with this slug already exists');
      }

      const courses = await sql`
        INSERT INTO courses (
          name, slug, description, num_days, certificate_type,
          min_days_for_participation, requires_all_days_for_completion,
          certificate_template, logo_url, default_organization, active
        ) VALUES (
          ${name}, ${slug}, ${description || null}, ${num_days || 1},
          ${certificate_type || 'completion'}, ${min_days_for_participation || 1},
          ${requires_all_days_for_completion ?? true}, ${certificate_template || 'standard'},
          ${logo_url || null}, ${default_organization || null}, ${active ?? true}
        )
        RETURNING *
      `;

      const course = courses[0];

      // Create day entries
      for (let i = 1; i <= (num_days || 1); i++) {
        await sql`
          INSERT INTO course_days (course_id, day_number)
          VALUES (${course.id}, ${i})
        `;
      }

      return json({ course }, 201);
    }

    // GET /admin/courses/:id - Get single course with details
    if (event.httpMethod === 'GET' && segments.length === 1) {
      const courseId = segments[0];

      const courses = await sql`
        SELECT * FROM courses WHERE id = ${courseId}
      `;

      if (courses.length === 0) {
        return notFound('Course not found');
      }

      const course = courses[0];

      const trainers = await sql`
        SELECT * FROM course_trainers 
        WHERE course_id = ${courseId}
        ORDER BY display_order
      `;

      const days = await sql`
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

      return json({ course, trainers, days });
    }

    // PUT /admin/courses/:id - Update course
    if (event.httpMethod === 'PUT' && segments.length === 1) {
      const courseId = segments[0];
      const body = JSON.parse(event.body);

      const {
        name,
        slug,
        description,
        num_days,
        certificate_type,
        min_days_for_participation,
        requires_all_days_for_completion,
        certificate_template,
        logo_url,
        default_organization,
        active,
      } = body;

      // Check if course exists
      const existing = await sql`SELECT * FROM courses WHERE id = ${courseId}`;
      if (existing.length === 0) {
        return notFound('Course not found');
      }

      // Check slug uniqueness (excluding current course)
      if (slug) {
        const slugCheck = await sql`
          SELECT id FROM courses WHERE slug = ${slug} AND id != ${courseId}
        `;
        if (slugCheck.length > 0) {
          return error('A course with this slug already exists');
        }
      }

      const courses = await sql`
        UPDATE courses SET
          name = COALESCE(${name}, name),
          slug = COALESCE(${slug}, slug),
          description = ${description},
          num_days = COALESCE(${num_days}, num_days),
          certificate_type = COALESCE(${certificate_type}, certificate_type),
          min_days_for_participation = COALESCE(${min_days_for_participation}, min_days_for_participation),
          requires_all_days_for_completion = COALESCE(${requires_all_days_for_completion}, requires_all_days_for_completion),
          certificate_template = COALESCE(${certificate_template}, certificate_template),
          logo_url = ${logo_url},
          default_organization = ${default_organization},
          active = COALESCE(${active}, active),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${courseId}
        RETURNING *
      `;

      // Ensure we have day entries for all days
      const course = courses[0];
      for (let i = 1; i <= course.num_days; i++) {
        await sql`
          INSERT INTO course_days (course_id, day_number)
          VALUES (${courseId}, ${i})
          ON CONFLICT (course_id, day_number) DO NOTHING
        `;
      }

      return json({ course });
    }

    // DELETE /admin/courses/:id - Delete course
    if (event.httpMethod === 'DELETE' && segments.length === 1) {
      const courseId = segments[0];

      const result = await sql`
        DELETE FROM courses WHERE id = ${courseId} RETURNING id
      `;

      if (result.length === 0) {
        return notFound('Course not found');
      }

      return json({ success: true, deleted: courseId });
    }

    return notFound('Endpoint not found');
  } catch (err) {
    console.error('Error in admin-courses function:', err);
    return error('Server error: ' + err.message, 500);
  }
}

export { handler };