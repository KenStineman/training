import { getDb } from './_shared/db.js';
import { verifyAuth } from './_shared/auth.js';
import { json, error, options } from './_shared/response.js';

async function handler(event, context) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return options();
  }

  if (event.httpMethod !== 'POST') {
    return error('Method not allowed', 405);
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

  try {
    const { certificateIds } = JSON.parse(event.body);

    if (!certificateIds || !Array.isArray(certificateIds) || certificateIds.length === 0) {
      return error('certificateIds array is required');
    }

    // Get certificate details
    const certificates = await sql`
      SELECT 
        cert.*,
        a.full_name as attendee_name,
        a.email as attendee_email,
        c.name as course_name
      FROM certificates cert
      JOIN enrollments e ON cert.enrollment_id = e.id
      JOIN attendees a ON e.attendee_id = a.id
      JOIN courses c ON e.course_id = c.id
      WHERE cert.id = ANY(${certificateIds})
        AND cert.emailed_at IS NULL
    `;

    if (certificates.length === 0) {
      return json({ sent: 0, message: 'No unsent certificates found' });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    
    if (!resendApiKey) {
      console.log('RESEND_API_KEY not configured, marking as sent without emailing');
      // Mark all as sent in development
      await sql`
        UPDATE certificates 
        SET emailed_at = CURRENT_TIMESTAMP 
        WHERE id = ANY(${certificates.map(c => c.id)})
      `;
      return json({ sent: certificates.length, total: certificates.length });
    }

    const baseUrl = process.env.URL || 'https://training.double-helix.com';
    const emailFrom = process.env.EMAIL_FROM || 'training@mail.double-helix.com';

    // Build batch of emails
    const emails = certificates.map(cert => {
      const certUrl = `${baseUrl}/cert/${cert.verification_code}`;
      const isCompletion = cert.certificate_type === 'completion';
      const certTitle = isCompletion ? 'Completion' : 'Participation';

      return {
        from: `Double Helix Training <${emailFrom}>`,
        to: [cert.attendee_email],
        subject: `Your Certificate of ${certTitle} - ${cert.course_name}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1e3a5f; margin-bottom: 10px;">Congratulations, ${cert.attendee_name}!</h1>
              <p style="font-size: 18px; color: #666;">You've earned a Certificate of ${certTitle}</p>
            </div>
            
            <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <p style="margin: 0 0 10px 0;"><strong>Course:</strong> ${cert.course_name}</p>
              <p style="margin: 0 0 10px 0;"><strong>Days Attended:</strong> ${cert.days_attended} of ${cert.total_days}</p>
              <p style="margin: 0;"><strong>Verification Code:</strong> <code style="background: #fff; padding: 2px 6px; border-radius: 4px;">${cert.verification_code}</code></p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${certUrl}" style="display: inline-block; background: #1e3a5f; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500;">View & Download Certificate</a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              You can also verify your certificate at any time by visiting:<br>
              <a href="${certUrl}" style="color: #1e3a5f;">${certUrl}</a>
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              This email was sent by Double Helix LLC.<br>
              <a href="https://double-helix.com" style="color: #1e3a5f;">double-helix.com</a>
            </p>
          </body>
          </html>
        `,
      };
    });

    // Send batch (Resend supports up to 100 emails per batch)
    const response = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emails),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Resend API error: ${response.status} ${errorData}`);
    }

    const result = await response.json();
    
    // Mark all as sent
    await sql`
      UPDATE certificates 
      SET emailed_at = CURRENT_TIMESTAMP 
      WHERE id = ANY(${certificates.map(c => c.id)})
    `;

    return json({ 
      sent: certificates.length, 
      total: certificates.length,
      resendData: result.data
    });
  } catch (err) {
    console.error('Error sending certificates:', err);
    return error('Server error: ' + err.message, 500);
  }
}

export { handler };