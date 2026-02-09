// Response helpers for Netlify Functions

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

export function json(data, statusCode = 200) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
    body: JSON.stringify(data),
  };
}

export function error(message, statusCode = 400) {
  return json({ error: message }, statusCode);
}

export function notFound(message = 'Not found') {
  return error(message, 404);
}

export function unauthorized(message = 'Unauthorized') {
  return error(message, 401);
}

export function serverError(message = 'Internal server error') {
  return error(message, 500);
}

export function pdf(buffer, filename) {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      ...CORS_HEADERS,
    },
    body: buffer.toString('base64'),
    isBase64Encoded: true,
  };
}

export function options() {
  return {
    statusCode: 204,
    headers: CORS_HEADERS,
    body: '',
  };
}

export default { json, error, notFound, unauthorized, serverError, pdf, options };