/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import authApi from '../api/authApi';
import type { LoginRequest, AuthResponse, ApiResponse } from '../api/authApi';

// ──────────────────────────────────────────────────────────────
// 1. TYPE DEFINITIONS
// ──────────────────────────────────────────────────────────────
export interface AuthContextType {
    user: AuthResponse | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isInitialized: boolean;
    roles: string[];
    login: (data: LoginRequest) => Promise<ApiResponse<AuthResponse>>;
    logout: () => void;
    updateUser: (userData: Partial<AuthResponse> & { roles?: string[] }) => void;
}

// ──────────────────────────────────────────────────────────────
// 2. HELPER – giải mã JWT payload
// ──────────────────────────────────────────────────────────────
const parseJwtPayload = (token: string): Record<string, unknown> | null => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
};

// ──────────────────────────────────────────────────────────────
// 3. LẤY ROLES TỪ JWT – đảm bảo trả về mảng
// ──────────────────────────────────────────────────────────────
const extractRoles = (token: string): string[] => {
    const payload = parseJwtPayload(token);
    console.log('[AuthContext] JWT payload:', payload); // debug
    if (!payload) return [];

    // ASP.NET Identity claim chuẩn
    const claimKey = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
    const raw = payload[claimKey] ?? payload['role'] ?? payload['roles'] ?? [];

    console.log('[AuthContext] Raw roles:', raw); // debug
    if (typeof raw === 'string') return [raw];
    return Array.isArray(raw) ? raw : [];
};

// ──────────────────────────────────────────────────────────────
// 4. CONTEXT
// ──────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ──────────────────────────────────────────────────────────────
// 5. PROVIDER
// ──────────────────────────────────────────────────────────────
interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<AuthResponse | null>(null);
    const [roles, setRoles] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isInitialized, setIsInitialized] = useState<boolean>(false);

    // Khởi tạo từ localStorage
    useEffect(() => {
        const initializeAuth = () => {
            try {
                const token = localStorage.getItem('accessToken');
                const storedUser = localStorage.getItem('user');

                if (token && storedUser) {
                    setUser(JSON.parse(storedUser) as AuthResponse);
                    const parsedRoles = extractRoles(token);
                    console.log('[AuthContext] Initial roles:', parsedRoles); // debug
                    setRoles(parsedRoles);
                    window.dispatchEvent(new Event('auth-change'));
                }
            } catch (error) {
                console.error('Lỗi khởi tạo auth:', error);
                ['user', 'accessToken', 'refreshToken', 'sessionId'].forEach(
                    (key) => localStorage.removeItem(key),
                );
            } finally {
                setIsInitialized(true);
            }
        };

        initializeAuth();
    }, []);

    // Đăng nhập
    const login = async (data: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
        setIsLoading(true);
        try {
            const response = await authApi.login(data);

            if (response.isSuccess && response.data) {
                const { token, refreshToken, sessionId } = response.data;

                localStorage.setItem('accessToken', token);
                localStorage.setItem('refreshToken', refreshToken);
                localStorage.setItem('sessionId', sessionId);
                localStorage.setItem('user', JSON.stringify(response.data));

                const parsedRoles = extractRoles(token);
                console.log('[AuthContext] Login roles:', parsedRoles); // debug
                setRoles(parsedRoles);
                setUser(response.data);
                window.dispatchEvent(new Event('auth-change'));
            }

            return response;
        } finally {
            setIsLoading(false);
        }
    };

    // Đăng xuất
    const logout = () => {
        authApi.logout();

        setUser(null);
        setRoles([]);
        ['accessToken', 'refreshToken', 'sessionId', 'user'].forEach((key) =>
            localStorage.removeItem(key),
        );
        window.dispatchEvent(new Event('auth-change'));
    };

    // Cập nhật thông tin user
    const updateUser = (updatedFields: Partial<AuthResponse> & { roles?: string[] }) => {
        if (user) {
            const { roles: rolesUpdate, ...rest } = updatedFields;
            const newUser = { ...user, ...rest };
            setUser(newUser);
            localStorage.setItem('user', JSON.stringify(newUser));
            if (rolesUpdate) {
                setRoles(rolesUpdate);
            }
        }
    };

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,
        isLoading,
        isInitialized,
        roles,
        login,
        logout,
        updateUser,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};

// ──────────────────────────────────────────────────────────────
// 6. CUSTOM HOOK
// ──────────────────────────────────────────────────────────────
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth phải được sử dụng bên trong AuthProvider');
    }
    return context;
};

export default AuthContext;