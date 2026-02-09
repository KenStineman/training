import { getDb } from './_shared/db.js';
import { json, notFound, error, pdf, options } from './_shared/response.js';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function handler(event, context) {
  if (event.httpMethod === 'OPTIONS') return options();

  const sql = getDb();

  const path = event.path
    .replace(/^\/?\.netlify\/functions\/certificates\/?/, '')
    .replace(/^\/?api\/certificates\/?/, '');
  const segments = path.split('/').filter(Boolean);

  try {
    if (event.httpMethod === 'GET' && segments.length === 1) {
      const code = segments[0].toUpperCase();

      const rows = await fetchCert(sql, code);
      if (!rows.length) return notFound('Certificate not found');

      return json(rows[0]);
    }

    if (event.httpMethod === 'GET' && segments[1] === 'pdf') {
      const code = segments[0].toUpperCase();

      const rows = await fetchCert(sql, code);
      if (!rows.length) return notFound('Certificate not found');

      const pdfBytes = await generateCertificatePDF(rows[0]);
      return pdf(Buffer.from(pdfBytes), `certificate-${code}.pdf`);
    }

    return notFound('Endpoint not found');
  } catch (err) {
    console.error(err);
    return error(err.message, 500);
  }
}

async function fetchCert(sql, code) {
  return sql`
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
}

async function generateCertificatePDF(cert) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([792, 612]);

  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const reg = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const italic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

  const { width, height } = page.getSize();

  const primary = rgb(0.118, 0.227, 0.373);
  const gold = rgb(0.831, 0.686, 0.216);
  const gray = rgb(0.45, 0.45, 0.45);

  // Load logo from ENV first, fallback to course logo
  const LOGO_URL = process.env.LOGO_URL || cert.logo_url;
  let logo;

  if (LOGO_URL) {
    try {
      console.log('Using LOGO_URL:', LOGO_URL);
      const img = await fetch(LOGO_URL).then(r => r.arrayBuffer());

      if (LOGO_URL.toLowerCase().endsWith('.jpg') || LOGO_URL.toLowerCase().endsWith('.jpeg')) {
        logo = await pdfDoc.embedJpg(img);
      } else {
        logo = await pdfDoc.embedPng(img);
      }
    } catch (err) {
      console.error('Failed to load certificate logo:', LOGO_URL, err);
    }
  }

  // WATERMARK
  if (logo) {
    page.drawImage(logo, {
      x: width / 2 - 220,
      y: height / 2 - 220,
      width: 440,
      height: 440,
      opacity: 0.06
    });
  }

  // Top logo
  if (logo) {
    const s = 0.25;
    page.drawImage(logo, {
      x: width / 2 - (logo.width * s) / 2,
      y: height - 90,
      width: logo.width * s,
      height: logo.height * s
    });
  }

  // Borders
  page.drawRectangle({ x: 30, y: 30, width: width - 60, height: height - 60, borderWidth: 3, borderColor: gold });
  page.drawRectangle({ x: 40, y: 40, width: width - 80, height: height - 80, borderWidth: 1, borderColor: primary });

  const isCompletion = cert.certificate_type === 'completion';
  const title = isCompletion ? 'Certificate of Completion' : 'Certificate of Participation';

  page.drawText(title, {
    x: width / 2 - bold.widthOfTextAtSize(title, 32) / 2,
    y: height - 150,
    size: 32,
    font: bold,
    color: primary
  });

  page.drawLine({
    start: { x: width / 2 - 150, y: height - 170 },
    end: { x: width / 2 + 150, y: height - 170 },
    thickness: 2,
    color: gold
  });

  page.drawText('This certifies that', {
    x: width / 2 - italic.widthOfTextAtSize('This certifies that', 16) / 2,
    y: height - 205,
    size: 16,
    font: italic,
    color: gray
  });

  page.drawText(cert.attendee_name, {
    x: width / 2 - bold.widthOfTextAtSize(cert.attendee_name, 36) / 2,
    y: height - 250,
    size: 36,
    font: bold,
    color: primary
  });

  const action = isCompletion ? 'has successfully completed' : 'has participated in';

  page.drawText(action, {
    x: width / 2 - italic.widthOfTextAtSize(action, 16) / 2,
    y: height - 285,
    size: 16,
    font: italic,
    color: gray
  });

  const cs = cert.course_name.length > 40 ? 20 : 24;

  page.drawText(cert.course_name, {
    x: width / 2 - bold.widthOfTextAtSize(cert.course_name, cs) / 2,
    y: height - 320,
    size: cs,
    font: bold,
    color: primary
  });

  const days = `Attended ${cert.days_attended} of ${cert.total_days} days`;

  page.drawText(days, {
    x: width / 2 - reg.widthOfTextAtSize(days, 14) / 2,
    y: height - 355,
    size: 14,
    font: reg,
    color: gray
  });

  const issued = new Date(cert.issued_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const dateText = `Issued: ${issued}`;

  page.drawText(dateText, {
    x: width / 2 - reg.widthOfTextAtSize(dateText, 12) / 2,
    y: height - 380,
    size: 12,
    font: reg,
    color: gray
  });

  const footerBaseY = 110;

  // Instructor centered
  if (cert.trainers?.length) {
    const t = cert.trainers.map(x => x.name).filter(Boolean).join(', ');
    const instructorText = `Instructor: ${t}`;

    page.drawText(instructorText, {
      x: width / 2 - bold.widthOfTextAtSize(instructorText, 12) / 2,
      y: footerBaseY + 30,
      size: 12,
      font: bold,
      color: primary
    });
  }

  // Company centered
  const companyText = 'Double Helix LLC';

  page.drawText(companyText, {
    x: width / 2 - bold.widthOfTextAtSize(companyText, 12) / 2,
    y: footerBaseY,
    size: 12,
    font: bold,
    color: primary
  });

  // Verification centered
  const verify = `Verification Code: ${cert.verification_code}`;

  page.drawText(verify, {
    x: width / 2 - reg.widthOfTextAtSize(verify, 10) / 2,
    y: footerBaseY - 20,
    size: 10,
    font: reg,
    color: gray
  });

  return pdfDoc.save();
}
