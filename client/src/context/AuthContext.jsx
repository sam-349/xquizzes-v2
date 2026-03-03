import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('xquizzes_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const res = await authAPI.getMe();
      setUser(res.data.user);
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('xquizzes_token', newToken);
    localStorage.setItem('xquizzes_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const adminLogin = async (email, password) => {
    const res = await authAPI.adminLogin({ email, password });
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('xquizzes_token', newToken);
    localStorage.setItem('xquizzes_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const register = async (name, email, password) => {
    const res = await authAPI.register({ name, email, password });
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('xquizzes_token', newToken);
    localStorage.setItem('xquizzes_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const adminRegister = async (name, email, password, adminSecretKey) => {
    const res = await authAPI.adminRegister({ name, email, password, adminSecretKey });
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('xquizzes_token', newToken);
    localStorage.setItem('xquizzes_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('xquizzes_token');
    localStorage.removeItem('xquizzes_user');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, adminLogin, adminRegister, register, logout, refreshUser, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
