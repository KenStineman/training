-- ============================================================================
-- Double Helix Training Platform - Database Schema
-- ============================================================================
-- Run this in your Netlify DB / Neon console to set up the database
-- 
-- Setup steps:
-- 1. Run: npx netlify db init
-- 2. Go to Netlify Dashboard > Your Site > Neon extension
-- 3. Click "Open Neon Console"
-- 4. Run this SQL in the SQL Editor
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- COURSES
-- ============================================================================

CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    num_days INTEGER NOT NULL DEFAULT 1,
    certificate_type VARCHAR(20) NOT NULL DEFAULT 'completion' 
        CHECK (certificate_type IN ('completion', 'participation', 'both')),
    min_days_for_participation INTEGER DEFAULT 1,
    requires_all_days_for_completion BOOLEAN DEFAULT true,
    logo_url VARCHAR(500),
    certificate_template VARCHAR(50) DEFAULT 'standard',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_active ON courses(active);

-- ============================================================================
-- COURSE TRAINERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS course_trainers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_trainers_course ON course_trainers(course_id);

-- ============================================================================
-- COURSE DAYS
-- ============================================================================

CREATE TABLE IF NOT EXISTS course_days (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    title VARCHAR(255),
    date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, day_number)
);

CREATE INDEX IF NOT EXISTS idx_days_course ON course_days(course_id);

-- ============================================================================
-- SURVEY QUESTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS survey_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_day_id UUID NOT NULL REFERENCES course_days(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) NOT NULL DEFAULT 'text'
        CHECK (question_type IN ('text', 'rating', 'multiple_choice', 'yes_no')),
    options JSONB, -- For multiple choice: ["Option A", "Option B", "Option C"]
    required BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_questions_day ON survey_questions(course_day_id);

-- ============================================================================
-- ATTENDEES
-- ============================================================================

CREATE TABLE IF NOT EXISTS attendees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    organization VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attendees_email ON attendees(email);

-- ============================================================================
-- ENROLLMENTS (links attendees to courses)
-- ============================================================================

CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attendee_id UUID NOT NULL REFERENCES attendees(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(attendee_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_attendee ON enrollments(attendee_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);

-- ============================================================================
-- ATTENDANCE (daily check-ins)
-- ============================================================================

CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    course_day_id UUID NOT NULL REFERENCES course_days(id) ON DELETE CASCADE,
    checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(enrollment_id, course_day_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_enrollment ON attendance(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_attendance_day ON attendance(course_day_id);

-- ============================================================================
-- SURVEY RESPONSES
-- ============================================================================

CREATE TABLE IF NOT EXISTS survey_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attendance_id UUID NOT NULL REFERENCES attendance(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES survey_questions(id) ON DELETE CASCADE,
    response_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(attendance_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_responses_attendance ON survey_responses(attendance_id);
CREATE INDEX IF NOT EXISTS idx_responses_question ON survey_responses(question_id);

-- ============================================================================
-- CERTIFICATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    certificate_type VARCHAR(20) NOT NULL 
        CHECK (certificate_type IN ('completion', 'participation')),
    verification_code VARCHAR(50) UNIQUE NOT NULL,
    days_attended INTEGER NOT NULL,
    total_days INTEGER NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    emailed_at TIMESTAMP WITH TIME ZONE,
    pdf_url VARCHAR(500),
    UNIQUE(enrollment_id, certificate_type)
);

CREATE INDEX IF NOT EXISTS idx_certificates_enrollment ON certificates(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_certificates_code ON certificates(verification_code);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to courses table
DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
CREATE TRIGGER update_courses_updated_at
    BEFORE UPDATE ON courses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to attendees table
DROP TRIGGER IF EXISTS update_attendees_updated_at ON attendees;
CREATE TRIGGER update_attendees_updated_at
    BEFORE UPDATE ON attendees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SAMPLE DATA (Optional - uncomment to insert test data)
-- ============================================================================

/*
-- Insert a sample course
INSERT INTO courses (slug, name, description, num_days, certificate_type)
VALUES (
    'regulated-agile-2025',
    'Regulated Agile and TIR-45 Training',
    'A comprehensive 4-day training course on implementing Agile methodologies in regulated environments.',
    4,
    'both'
);

-- Get the course ID
DO $$
DECLARE
    course_uuid UUID;
BEGIN
    SELECT id INTO course_uuid FROM courses WHERE slug = 'regulated-agile-2025';
    
    -- Insert trainer
    INSERT INTO course_trainers (course_id, name, title, display_order)
    VALUES (course_uuid, 'Kelly Weyrauch', 'Lead Instructor', 1);
    
    -- Insert days
    INSERT INTO course_days (course_id, day_number, title) VALUES
        (course_uuid, 1, 'Day 1: Agile Foundations in Regulated Environments'),
        (course_uuid, 2, 'Day 2: TIR-45 Framework Deep Dive'),
        (course_uuid, 3, 'Day 3: Implementation Strategies'),
        (course_uuid, 4, 'Day 4: Compliance and Continuous Improvement');
END $$;

-- Insert sample survey questions for Day 1
DO $$
DECLARE
    day_uuid UUID;
BEGIN
    SELECT id INTO day_uuid FROM course_days 
    WHERE course_id = (SELECT id FROM courses WHERE slug = 'regulated-agile-2025')
    AND day_number = 1;
    
    INSERT INTO survey_questions (course_day_id, question_text, question_type, display_order) VALUES
        (day_uuid, 'How would you rate today''s session overall?', 'rating', 1),
        (day_uuid, 'What was the most valuable thing you learned today?', 'text', 2),
        (day_uuid, 'Do you feel prepared for tomorrow''s material?', 'yes_no', 3);
END $$;
*/

-- ============================================================================
-- USEFUL QUERIES (for reference)
-- ============================================================================

/*
-- Get all attendees who completed all days of a course
SELECT 
    a.email,
    a.full_name,
    c.name as course_name,
    COUNT(att.id) as days_attended,
    c.num_days as total_days
FROM attendees a
JOIN enrollments e ON a.id = e.attendee_id
JOIN courses c ON e.course_id = c.id
JOIN attendance att ON e.id = att.enrollment_id
GROUP BY a.id, c.id
HAVING COUNT(att.id) = c.num_days;

-- Get attendance summary for a course
SELECT 
    cd.day_number,
    cd.title,
    COUNT(att.id) as attendee_count
FROM course_days cd
LEFT JOIN attendance att ON cd.id = att.course_day_id
WHERE cd.course_id = 'YOUR_COURSE_UUID'
GROUP BY cd.id
ORDER BY cd.day_number;

-- Get survey responses for a day
SELECT 
    a.full_name,
    sq.question_text,
    sr.response_value
FROM survey_responses sr
JOIN attendance att ON sr.attendance_id = att.id
JOIN enrollments e ON att.enrollment_id = e.id
JOIN attendees a ON e.attendee_id = a.id
JOIN survey_questions sq ON sr.question_id = sq.id
JOIN course_days cd ON sq.course_day_id = cd.id
WHERE cd.course_id = 'YOUR_COURSE_UUID'
AND cd.day_number = 1
ORDER BY a.full_name, sq.display_order;
*/
