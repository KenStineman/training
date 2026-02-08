// Netlify Identity authentication utilities

/**
 * Initialize Netlify Identity
 */
export function initNetlifyIdentity() {
  if (typeof window !== 'undefined' && window.netlifyIdentity) {
    window.netlifyIdentity.init();
  }
}

/**
 * Get current user
 */
export function getCurrentUser() {
  if (typeof window !== 'undefined' && window.netlifyIdentity) {
    return window.netlifyIdentity.currentUser();
  }
  return null;
}

/**
 * Check if user is logged in
 */
export function isLoggedIn() {
  return getCurrentUser() !== null;
}

/**
 * Check if user email is from allowed domain
 */
export function isAllowedDomain(email, allowedDomains = ['double-helix.com']) {
  if (!email) return false;
  const domain = email.split('@')[1]?.toLowerCase();
  return allowedDomains.some(d => d.toLowerCase() === domain);
}

/**
 * Open login modal
 */
export function openLogin() {
  if (typeof window !== 'undefined' && window.netlifyIdentity) {
    window.netlifyIdentity.open('login');
  }
}

/**
 * Open signup modal
 */
export function openSignup() {
  if (typeof window !== 'undefined' && window.netlifyIdentity) {
    window.netlifyIdentity.open('signup');
  }
}

/**
 * Logout
 */
export function logout() {
  if (typeof window !== 'undefined' && window.netlifyIdentity) {
    window.netlifyIdentity.logout();
  }
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback) {
  if (typeof window !== 'undefined' && window.netlifyIdentity) {
    window.netlifyIdentity.on('login', (user) => callback(user));
    window.netlifyIdentity.on('logout', () => callback(null));
    window.netlifyIdentity.on('init', (user) => callback(user));
  }
}

/**
 * Get user's access token
 */
export async function getAccessToken() {
  const user = getCurrentUser();
  if (!user) return null;
  
  // Refresh token if needed
  try {
    const token = await user.jwt();
    return token;
  } catch (error) {
    console.error('Failed to get access token:', error);
    return null;
  }
}

/**
 * Get user display info
 */
export function getUserInfo() {
  const user = getCurrentUser();
  if (!user) return null;
  
  return {
    id: user.id,
    email: user.email,
    name: user.user_metadata?.full_name || user.email.split('@')[0],
    avatar: user.user_metadata?.avatar_url,
  };
}

export default {
  initNetlifyIdentity,
  getCurrentUser,
  isLoggedIn,
  isAllowedDomain,
  openLogin,
  openSignup,
  logout,
  onAuthStateChange,
  getAccessToken,
  getUserInfo,
};
