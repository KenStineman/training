import { getDb } from './_shared/db.js';
import { verifyAuth } from './_shared/auth.js';
import { json, notFound, error, pdf, options } from './_shared/response.js';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function handler(event, context) {
  if (event.httpMethod === 'OPTIONS') return options();

  const auth = await verifyAuth(event);
  if (!auth.authenticated) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: auth.error || 'Unauthorized' }),
    };
  }

  const sql = getDb();

  const path = event.path
    .replace(/^\/?\.netlify\/functions\/admin-course-report\/?/, '')
    .replace(/^\/?api\/admin\/courses\/?/, '');
  const segments = path.split('/').filter(Boolean);

  // Expecting: /:id/report/pdf or /:id/report/csv
  if (segments.length < 3 || segments[1] !== 'report') {
    return notFound('Endpoint not found');
  }

  const courseId = segments[0];
  const format = segments[2];

  try {
    const reportData = await fetchReportData(sql, courseId);
    if (!reportData.course) {
      return notFound('Course not found');
    }

    if (format === 'pdf') {
      const pdfBytes = await generateReportPDF(reportData);
      return pdf(Buffer.from(pdfBytes), `training-report-${reportData.course.slug}.pdf`);
    } else if (format === 'csv') {
      const csv = generateReportCSV(reportData);
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="training-report-${reportData.course.slug}.csv"`,
          'Access-Control-Allow-Origin': '*',
        },
        body: csv,
      };
    }

    return notFound('Invalid format. Use pdf or csv.');
  } catch (err) {
    console.error(err);
    return error(err.message, 500);
  }
}

async function fetchReportData(sql, courseId) {
  // Get course
  const courses = await sql`
    SELECT * FROM courses WHERE id = ${courseId}
  `;
  if (!courses.length) return { course: null };
  const course = courses[0];

  // Get trainers
  const trainers = await sql`
    SELECT name, title FROM course_trainers 
    WHERE course_id = ${courseId} 
    ORDER BY display_order
  `;

  // Get days
  const days = await sql`
    SELECT day_number, title, date, hours 
    FROM course_days 
    WHERE course_id = ${courseId} 
    ORDER BY day_number
  `;

  // Get attendees with attendance details
  const attendees = await sql`
    SELECT 
      a.full_name,
      a.email,
      a.organization,
      e.id as enrollment_id,
      (
        SELECT json_agg(json_build_object(
          'day_number', cd.day_number,
          'checked_in_at', att.checked_in_at
        ) ORDER BY cd.day_number)
        FROM attendance att
        JOIN course_days cd ON att.course_day_id = cd.id
        WHERE att.enrollment_id = e.id
      ) as attendance,
      (
        SELECT COUNT(*) FROM attendance att WHERE att.enrollment_id = e.id
      )::int as days_attended,
      (
        SELECT COALESCE(SUM(cd.hours), 0)
        FROM attendance att
        JOIN course_days cd ON att.course_day_id = cd.id
        WHERE att.enrollment_id = e.id
      ) as hours_attended,
      (
        SELECT json_build_object(
          'type', cert.certificate_type,
          'code', cert.verification_code,
          'issued_at', cert.issued_at
        )
        FROM certificates cert
        WHERE cert.enrollment_id = e.id
      ) as certificate
    FROM attendees a
    JOIN enrollments e ON a.id = e.attendee_id
    WHERE e.course_id = ${courseId}
    ORDER BY a.full_name
  `;

  // Calculate totals
  const totalHours = days.reduce((sum, d) => sum + (parseFloat(d.hours) || 0), 0);
  const completedCount = attendees.filter(a => a.days_attended >= course.num_days).length;

  return {
    course,
    trainers,
    days,
    attendees,
    totalHours,
    completedCount,
  };
}

async function generateReportPDF(data) {
  const { course, trainers, days, attendees, totalHours, completedCount } = data;

  const pdfDoc = await PDFDocument.create();
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const reg = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const primary = rgb(0.118, 0.227, 0.373);
  const gray = rgb(0.3, 0.3, 0.3);
  const lightGray = rgb(0.6, 0.6, 0.6);
  const black = rgb(0, 0, 0);

  // Calculate pages needed
  const attendeesPerPage = 20;
  const totalPages = Math.ceil(attendees.length / attendeesPerPage) || 1;

  for (let pageNum = 0; pageNum < totalPages; pageNum++) {
    const page = pdfDoc.addPage([612, 792]); // Letter size
    const { width, height } = page.getSize();
    let y = height - 50;

    // Header (first page only has full header)
    if (pageNum === 0) {
      // Title
      page.drawText('Training Report', {
        x: 50,
        y,
        size: 24,
        font: bold,
        color: primary,
      });
      y -= 30;

      // Course name
      page.drawText(course.name, {
        x: 50,
        y,
        size: 16,
        font: bold,
        color: black,
      });
      y -= 20;

      // Description
      if (course.description) {
        const descLines = wrapText(course.description, 80);
        for (const line of descLines.slice(0, 3)) {
          page.drawText(line, {
            x: 50,
            y,
            size: 10,
            font: reg,
            color: gray,
          });
          y -= 14;
        }
      }
      y -= 10;

      // Course details
      const startDate = days.find(d => d.date)?.date;
      const endDate = [...days].reverse().find(d => d.date)?.date;
      
      let dateRange = 'Dates not set';
      if (startDate && endDate) {
        const start = new Date(startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        const end = new Date(endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        dateRange = start === end ? start : `${start} – ${end}`;
      }

      page.drawText(`Dates: ${dateRange}`, { x: 50, y, size: 10, font: reg, color: gray });
      y -= 14;
      page.drawText(`Duration: ${course.num_days} days (${totalHours} hours)`, { x: 50, y, size: 10, font: reg, color: gray });
      y -= 14;

      if (trainers.length > 0) {
        const trainerNames = trainers.map(t => t.title ? `${t.name}, ${t.title}` : t.name).join('; ');
        page.drawText(`Instructor(s): ${trainerNames}`, { x: 50, y, size: 10, font: reg, color: gray });
        y -= 14;
      }

      // Summary stats
      y -= 10;
      page.drawText(`Total Enrolled: ${attendees.length}`, { x: 50, y, size: 10, font: bold, color: black });
      page.drawText(`Completed: ${completedCount}`, { x: 200, y, size: 10, font: bold, color: black });
      const completionRate = attendees.length > 0 ? Math.round((completedCount / attendees.length) * 100) : 0;
      page.drawText(`Completion Rate: ${completionRate}%`, { x: 320, y, size: 10, font: bold, color: black });
      y -= 30;
    } else {
      // Continuation header
      page.drawText(`Training Report - ${course.name} (continued)`, {
        x: 50,
        y,
        size: 12,
        font: bold,
        color: primary,
      });
      y -= 30;
    }

    // Table header
    const colX = {
      name: 50,
      org: 180,
      days: 300,
      hours: 360,
      cert: 420,
      code: 500,
    };

    page.drawText('Attendee', { x: colX.name, y, size: 9, font: bold, color: black });
    page.drawText('Organization', { x: colX.org, y, size: 9, font: bold, color: black });
    page.drawText('Days', { x: colX.days, y, size: 9, font: bold, color: black });
    page.drawText('Hours', { x: colX.hours, y, size: 9, font: bold, color: black });
    page.drawText('Certificate', { x: colX.cert, y, size: 9, font: bold, color: black });
    page.drawText('Code', { x: colX.code, y, size: 9, font: bold, color: black });
    y -= 5;

    // Header line
    page.drawLine({
      start: { x: 50, y },
      end: { x: 562, y },
      thickness: 1,
      color: primary,
    });
    y -= 15;

    // Attendee rows
    const startIdx = pageNum * attendeesPerPage;
    const endIdx = Math.min(startIdx + attendeesPerPage, attendees.length);
    const pageAttendees = attendees.slice(startIdx, endIdx);

    for (const att of pageAttendees) {
      const name = att.full_name.length > 22 ? att.full_name.substring(0, 20) + '...' : att.full_name;
      const org = (att.organization || '—').length > 18 ? att.organization.substring(0, 16) + '...' : (att.organization || '—');
      const daysText = `${att.days_attended}/${course.num_days}`;
      const hoursText = `${parseFloat(att.hours_attended) || 0}`;
      const certType = att.certificate?.type ? att.certificate.type.charAt(0).toUpperCase() + att.certificate.type.slice(1) : '—';
      const certCode = att.certificate?.code || '—';

      page.drawText(name, { x: colX.name, y, size: 9, font: reg, color: black });
      page.drawText(org, { x: colX.org, y, size: 9, font: reg, color: gray });
      page.drawText(daysText, { x: colX.days, y, size: 9, font: reg, color: black });
      page.drawText(hoursText, { x: colX.hours, y, size: 9, font: reg, color: black });
      page.drawText(certType, { x: colX.cert, y, size: 9, font: reg, color: black });
      page.drawText(certCode, { x: colX.code, y, size: 8, font: reg, color: lightGray });

      y -= 18;
    }

    // Footer
    page.drawText(`Page ${pageNum + 1} of ${totalPages}`, {
      x: width / 2 - 30,
      y: 30,
      size: 8,
      font: reg,
      color: lightGray,
    });

    const generated = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    page.drawText(`Generated: ${generated}`, {
      x: 50,
      y: 30,
      size: 8,
      font: reg,
      color: lightGray,
    });

    page.drawText('Double Helix LLC', {
      x: width - 120,
      y: 30,
      size: 8,
      font: reg,
      color: lightGray,
    });
  }

  // Signature page
  const sigPage = pdfDoc.addPage([612, 792]);
  let y = 742;

  sigPage.drawText('Training Verification', {
    x: 50,
    y,
    size: 18,
    font: bold,
    color: primary,
  });
  y -= 40;

  sigPage.drawText(`Course: ${course.name}`, { x: 50, y, size: 11, font: reg, color: black });
  y -= 20;

  const startDate = days.find(d => d.date)?.date;
  const endDate = [...days].reverse().find(d => d.date)?.date;
  if (startDate) {
    const start = new Date(startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const end = endDate ? new Date(endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : start;
    sigPage.drawText(`Date(s): ${start === end ? start : `${start} – ${end}`}`, { x: 50, y, size: 11, font: reg, color: black });
  }
  y -= 20;
  sigPage.drawText(`Total Attendees: ${attendees.length}`, { x: 50, y, size: 11, font: reg, color: black });
  y -= 20;
  sigPage.drawText(`Completed: ${completedCount}`, { x: 50, y, size: 11, font: reg, color: black });
  y -= 60;

  sigPage.drawText('Instructor Signature:', { x: 50, y, size: 11, font: bold, color: black });
  y -= 40;
  sigPage.drawLine({ start: { x: 50, y }, end: { x: 300, y }, thickness: 1, color: black });
  y -= 20;
  if (trainers.length > 0) {
    sigPage.drawText(trainers[0].name, { x: 50, y, size: 10, font: reg, color: gray });
  }
  y -= 40;
  sigPage.drawText('Date:', { x: 50, y, size: 11, font: bold, color: black });
  y -= 40;
  sigPage.drawLine({ start: { x: 50, y }, end: { x: 200, y }, thickness: 1, color: black });

  return pdfDoc.save();
}

function generateReportCSV(data) {
  const { course, trainers, days, attendees, totalHours } = data;

  const lines = [];

  // Header info as comments
  lines.push(`# Training Report: ${course.name}`);
  lines.push(`# Description: ${(course.description || '').replace(/\n/g, ' ')}`);
  lines.push(`# Days: ${course.num_days}, Total Hours: ${totalHours}`);
  if (trainers.length > 0) {
    lines.push(`# Instructor(s): ${trainers.map(t => t.name).join(', ')}`);
  }
  lines.push(`# Generated: ${new Date().toISOString()}`);
  lines.push('');

  // Column headers
  const dayHeaders = days.map(d => `Day ${d.day_number}`).join(',');
  lines.push(`Full Name,Email,Organization,Days Attended,Hours Attended,${dayHeaders},Certificate Type,Verification Code,Issued Date`);

  // Data rows
  for (const att of attendees) {
    const dayChecks = days.map(d => {
      const attended = att.attendance?.find(a => a.day_number === d.day_number);
      return attended ? 'Y' : 'N';
    }).join(',');

    const row = [
      `"${att.full_name}"`,
      att.email,
      `"${att.organization || ''}"`,
      att.days_attended,
      parseFloat(att.hours_attended) || 0,
      dayChecks,
      att.certificate?.type || '',
      att.certificate?.code || '',
      att.certificate?.issued_at ? new Date(att.certificate.issued_at).toISOString().split('T')[0] : '',
    ];
    lines.push(row.join(','));
  }

  return lines.join('\n');
}

function wrapText(text, maxChars) {
  const words = text.split(' ');
  const lines = [];
  let current = '';

  for (const word of words) {
    if ((current + ' ' + word).trim().length <= maxChars) {
      current = (current + ' ' + word).trim();
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}