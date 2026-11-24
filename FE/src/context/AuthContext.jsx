import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { getSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.success && res.data) {
            setUser(res.data);
            localStorage.setItem('user', JSON.stringify(res.data));
            // Kết nối socket cho user
            const socket = getSocket();
            socket.emit('join_user', res.data.id);
          }
        } catch (err) {
          console.warn('Phiên đăng nhập hết hạn:', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, []);

  const login = async (ten_dang_nhap, mat_khau) => {
    const res = await api.post('/auth/login', { ten_dang_nhap, mat_khau });
    if (res.success && res.data) {
      const { token: newToken, user: userData } = res.data;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));

      // Gia nhập socket room
      const socket = getSocket();
      socket.emit('join_user', userData.id);

      return userData;
    }
    throw new Error(res.message || 'Đăng nhập thất bại');
  };

  const register = async (formData) => {
    const res = await api.post('/auth/register', formData);
    if (res.success && res.data) {
      const { token: newToken, user: userData } = res.data;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));

      const socket = getSocket();
      socket.emit('join_user', userData.id);

      return userData;
    }
    throw new Error(res.message || 'Đăng ký thất bại');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    disconnectSocket();
  };

  const isAdmin = user?.vai_tro === 'admin';

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
