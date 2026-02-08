import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChange, getCurrentUser, logout as doLogout, openLogin } from '../utils/auth';

/**
 * Hook for managing authentication state
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial user state
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setLoading(false);

    // Subscribe to auth changes
    onAuthStateChange((newUser) => {
      setUser(newUser);
      setLoading(false);
    });
  }, []);

  const login = useCallback(() => {
    openLogin();
  }, []);

  const logout = useCallback(() => {
    doLogout();
    setUser(null);
  }, []);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
  };
}

export default useAuth;
