import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminGuard: React.FC = () => {
    const { isAuthenticated, isInitialized, roles } = useAuth();

    console.log('🛡️ AdminGuard – isInit:', isInitialized, 'isAuth:', isAuthenticated, 'roles:', roles);

    if (!isInitialized) {
        return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Kiểm tra quyền Admin (phòng trường hợp role có khoảng trắng thừa)
    if (!roles.some(r => r.trim() === 'Admin')) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <Outlet />;
};

export default AdminGuard;