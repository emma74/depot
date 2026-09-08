import { useState, useCallback, useEffect } from 'react';
import { AuthContext } from './authContextObject';
import { authService } from '../services/authService';
import { userService } from '../services/userService';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(!!token);

  useEffect(() => {
    if (!token) return;
    userService
      .getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoadingUser(false));
  }, [token]);

  const login = useCallback(async (username, password) => {
    const { token } = await authService.login(username, password);
    localStorage.setItem('token', token);
    setLoadingUser(true);
    setToken(token);
  }, []);

  const register = useCallback(async (username, password) => {
    const { token } = await authService.register(username, password);
    localStorage.setItem('token', token);
    setLoadingUser(true);
    setToken(token);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setLoadingUser(false);
  }, []);

  const value = {
    token,
    user,
    loadingUser,
    isAuthenticated: !!token,
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
