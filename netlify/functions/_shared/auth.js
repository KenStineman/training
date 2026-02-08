// Verify Netlify Identity JWT token

const ALLOWED_DOMAINS = ['double-helix.com'];

export async function verifyAuth(event) {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authenticated: false, error: 'No authorization token provided' };
  }

  const token = authHeader.substring(7);
  
  try {
    // Decode JWT (Netlify Identity tokens are JWTs)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { authenticated: false, error: 'Invalid token format' };
    }

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    // Check expiration
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return { authenticated: false, error: 'Token expired' };
    }

    // Check email domain
    const email = payload.email;
    if (!email) {
      return { authenticated: false, error: 'No email in token' };
    }

    const domain = email.split('@')[1]?.toLowerCase();
    if (!ALLOWED_DOMAINS.includes(domain)) {
      return { authenticated: false, error: 'Email domain not allowed' };
    }

    return {
      authenticated: true,
      user: {
        id: payload.sub,
        email: payload.email,
        name: payload.user_metadata?.full_name || email.split('@')[0],
      },
    };
  } catch (err) {
    console.error('Auth verification error:', err);
    return { authenticated: false, error: 'Token verification failed' };
  }
}

export function requireAuth(handler) {
  return async (event, context) => {
    const auth = await verifyAuth(event);
    
    if (!auth.authenticated) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: auth.error || 'Unauthorized' }),
      };
    }

    // Attach user to event for handler use
    event.user = auth.user;
    return handler(event, context);
  };
}

export default verifyAuth;
