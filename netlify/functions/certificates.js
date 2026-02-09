import { getDb } from './_shared/db.js';
import { json, notFound, error, pdf, options } from './_shared/response.js';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function handler(event, context) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return options();
  }

  const sql = getDb();
  
  // Parse path - handle both formats
  const path = event.path
    .replace(/^\/?\.netlify\/functions\/certificates\/?/, '')
    .replace(/^\/?api\/certificates\/?/, '');
  const segments = path.split('/').filter(Boolean);

  try {
    // GET /certificates/:code - Verify certificate
    if (event.httpMethod === 'GET' && segments.length === 1) {
      const code = segments[0].toUpperCase();

      const certificates = await sql`
        SELECT 
          cert.*,
          a.full_name as attendee_name,
          a.email as attendee_email,
          c.name as course_name,
          c.logo_url,
          json_agg(DISTINCT jsonb_build_object(
            'name', ct.name,
            'title', ct.title
          )) FILTER (WHERE ct.id IS NOT NULL) as trainers
        FROM certificates cert
        JOIN enrollments e ON cert.enrollment_id = e.id
        JOIN attendees a ON e.attendee_id = a.id
        JOIN courses c ON e.course_id = c.id
        LEFT JOIN course_trainers ct ON c.id = ct.course_id
        WHERE cert.verification_code = ${code}
        GROUP BY cert.id, a.id, c.id
      `;

      if (certificates.length === 0) {
        return notFound('Certificate not found');
      }

      return json(certificates[0]);
    }

    // GET /certificates/:code/pdf - Download certificate PDF
    if (event.httpMethod === 'GET' && segments.length === 2 && segments[1] === 'pdf') {
      const code = segments[0].toUpperCase();

      const certificates = await sql`
        SELECT 
          cert.*,
          a.full_name as attendee_name,
          a.email as attendee_email,
          c.name as course_name,
          c.logo_url,
          json_agg(DISTINCT jsonb_build_object(
            'name', ct.name,
            'title', ct.title
          )) FILTER (WHERE ct.id IS NOT NULL) as trainers
        FROM certificates cert
        JOIN enrollments e ON cert.enrollment_id = e.id
        JOIN attendees a ON e.attendee_id = a.id
        JOIN courses c ON e.course_id = c.id
        LEFT JOIN course_trainers ct ON c.id = ct.course_id
        WHERE cert.verification_code = ${code}
        GROUP BY cert.id, a.id, c.id
      `;

      if (certificates.length === 0) {
        return notFound('Certificate not found');
      }

      const cert = certificates[0];
      const pdfBytes = await generateCertificatePDF(cert);
      
      return pdf(Buffer.from(pdfBytes), `certificate-${code}.pdf`);
    }

    return notFound('Endpoint not found');
  } catch (err) {
    console.error('Error in certificates function:', err);
    return error('Server error: ' + err.message, 500);
  }
}

async function generateCertificatePDF(cert) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([792, 612]); // Landscape letter
  
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const timesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

  const { width, height } = page.getSize();
  const primaryColor = rgb(0.118, 0.227, 0.373); // #1e3a5f
  const goldColor = rgb(0.831, 0.686, 0.216); // #d4af37
  const grayColor = rgb(0.4, 0.4, 0.4);

  // Border
  page.drawRectangle({
    x: 30,
    y: 30,
    width: width - 60,
    height: height - 60,
    borderColor: goldColor,
    borderWidth: 3,
  });

  // Inner border
  page.drawRectangle({
    x: 40,
    y: 40,
    width: width - 80,
    height: height - 80,
    borderColor: primaryColor,
    borderWidth: 1,
  });

  // Title
  const isCompletion = cert.certificate_type === 'completion';
  const title = isCompletion ? 'Certificate of Completion' : 'Certificate of Participation';
  
  page.drawText(title, {
    x: width / 2 - helveticaBold.widthOfTextAtSize(title, 32) / 2,
    y: height - 120,
    size: 32,
    font: helveticaBold,
    color: primaryColor,
  });

  // Decorative line
  page.drawLine({
    start: { x: width / 2 - 150, y: height - 140 },
    end: { x: width / 2 + 150, y: height - 140 },
    thickness: 2,
    color: goldColor,
  });

  // "This certifies that"
  const certifiesText = 'This certifies that';
  page.drawText(certifiesText, {
    x: width / 2 - timesItalic.widthOfTextAtSize(certifiesText, 16) / 2,
    y: height - 180,
    size: 16,
    font: timesItalic,
    color: grayColor,
  });

  // Attendee name
  const name = cert.attendee_name;
  page.drawText(name, {
    x: width / 2 - helveticaBold.widthOfTextAtSize(name, 36) / 2,
    y: height - 230,
    size: 36,
    font: helveticaBold,
    color: primaryColor,
  });

  // "has successfully completed/participated in"
  const actionText = isCompletion 
    ? 'has successfully completed' 
    : 'has participated in';
  page.drawText(actionText, {
    x: width / 2 - timesItalic.widthOfTextAtSize(actionText, 16) / 2,
    y: height - 270,
    size: 16,
    font: timesItalic,
    color: grayColor,
  });

  // Course name
  const courseName = cert.course_name;
  const courseNameSize = courseName.length > 40 ? 20 : 24;
  page.drawText(courseName, {
    x: width / 2 - helveticaBold.widthOfTextAtSize(courseName, courseNameSize) / 2,
    y: height - 310,
    size: courseNameSize,
    font: helveticaBold,
    color: primaryColor,
  });

  // Days attended
  const daysText = `Attended ${cert.days_attended} of ${cert.total_days} days`;
  page.drawText(daysText, {
    x: width / 2 - helvetica.widthOfTextAtSize(daysText, 14) / 2,
    y: height - 350,
    size: 14,
    font: helvetica,
    color: grayColor,
  });

  // Issue date
  const issueDate = new Date(cert.issued_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const dateText = `Issued: ${issueDate}`;
  page.drawText(dateText, {
    x: width / 2 - helvetica.widthOfTextAtSize(dateText, 12) / 2,
    y: height - 380,
    size: 12,
    font: helvetica,
    color: grayColor,
  });

  // Trainers
  if (cert.trainers && cert.trainers.length > 0 && cert.trainers[0]?.name) {
    const trainerNames = cert.trainers.map(t => t.name).filter(Boolean).join(', ');
    const trainerLabel = 'Instructor:';
    
    page.drawText(trainerLabel, {
      x: 100,
      y: 100,
      size: 10,
      font: helvetica,
      color: grayColor,
    });

    page.drawText(trainerNames, {
      x: 100,
      y: 85,
      size: 12,
      font: helveticaBold,
      color: primaryColor,
    });

    // Signature line
    page.drawLine({
      start: { x: 80, y: 110 },
      end: { x: 250, y: 110 },
      thickness: 1,
      color: grayColor,
    });
  }

  // Verification code
  const verifyText = `Verification Code: ${cert.verification_code}`;
  page.drawText(verifyText, {
    x: width - 100 - helvetica.widthOfTextAtSize(verifyText, 10),
    y: 60,
    size: 10,
    font: helvetica,
    color: grayColor,
  });

  // Company name
  const companyText = 'Double Helix LLC';
  page.drawText(companyText, {
    x: width - 100 - helveticaBold.widthOfTextAtSize(companyText, 12),
    y: 100,
    size: 12,
    font: helveticaBold,
    color: primaryColor,
  });

  page.drawLine({
    start: { x: width - 250, y: 110 },
    end: { x: width - 80, y: 110 },
    thickness: 1,
    color: grayColor,
  });

  return pdfDoc.save();
}