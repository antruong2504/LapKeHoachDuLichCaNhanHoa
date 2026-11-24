import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export default function PrivateRoute() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner text="Đang kiểm tra phiên đăng nhập..." />;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
