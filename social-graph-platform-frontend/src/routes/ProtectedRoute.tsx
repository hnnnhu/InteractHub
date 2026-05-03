import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
    children?: React.ReactNode;
    redirectTo?: string;
    requiredRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    redirectTo = '/login',
    requiredRoles,
}) => {
    const { isAuthenticated, isInitialized, roles } = useAuth();

    console.log('🔐 ProtectedRoute check:', {
        requiredRoles,
        userRoles: roles,
        isAuthenticated,
    });

    // 1. Chưa khởi tạo xong → hiển thị spinner
    if (!isInitialized) {
        return (
            <div className="min-h-screen bg-[#0D0D12] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-[#FF1493] animate-spin" />
            </div>
        );
    }

    // 2. Chưa đăng nhập → redirect về login
    if (!isAuthenticated) {
        return <Navigate to={redirectTo} replace />;
    }

    // 3. Kiểm tra quyền (nếu có yêu cầu role)
    if (requiredRoles && requiredRoles.length > 0) {
        const hasRequiredRole = requiredRoles.some((role) =>
            roles.includes(role)
        );
        console.log(
            `Role check: required=${requiredRoles}, hasRole=${hasRequiredRole}`
        );

        if (!hasRequiredRole) {
            return <Navigate to="/unauthorized" replace />;
        }
    }

    // 4. Cho phép truy cập – hỗ trợ cả children trực tiếp và nested routes
    return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;