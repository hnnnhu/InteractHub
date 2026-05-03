// src/api/authApi.ts
import { isAxiosError } from 'axios'; // 🚀 THÊM DÒNG NÀY ĐỂ CHECK LỖI CHUẨN XÁC
import axiosInstance from './axiosInstance';

// ==========================================
// 1. INTERFACES (Tương ứng với C# DTOs)
// ==========================================

// --- Requests ---
export interface RegisterRequest {
    fullName: string;
    userName: string;
    email: string;
    password: string;
    confirmPassword: string;
    deviceInfo?: string;
    ipAddress?: string;
}

export interface LoginRequest {
    emailOrUserName: string;
    password: string;
    deviceInfo?: string;
    ipAddress?: string;
}

export interface RefreshTokenRequest {
    token: string;
    refreshToken: string;
    deviceInfo?: string;
    ipAddress?: string;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ResetPasswordRequest {
    email: string;
    token: string;
    newPassword: string;
    confirmNewPassword: string;
}

export interface LogoutRequest {
    refreshToken: string;
}

// --- Responses ---
export interface AuthResponse {
    token: string;
    refreshToken: string;
    sessionId: string;
    expiresAt: string;
    refreshTokenExpiresAt: string;
    userId: string;
    email: string;
    userName: string;
    fullName: string;
    avatarUrl?: string | null;
    bio?: string | null;
}

export interface TokenResponse {
    accessToken: string;
    refreshToken: string;
    sessionId?: string;
    expiresAt: string;
}

export interface ApiResponse<T = void> {
    isSuccess: boolean;
    message?: string;
    errors?: string[] | Record<string, string[]>;
    data?: T;
}

// ==========================================
// 2. API ENDPOINTS
// ==========================================

const AUTH_URL = '/auth';

export const authApi = {
    /**
     * Đăng ký tài khoản mới
     */
    register: async (data: RegisterRequest): Promise<ApiResponse<AuthResponse>> => {
        try {
            const response = await axiosInstance.post<ApiResponse<AuthResponse>>(`${AUTH_URL}/register`, data);
            return response.data;
        } catch (error: unknown) { // 🚀 Sửa 'any' thành 'unknown'
            if (isAxiosError(error) && error.response?.data) return error.response.data as ApiResponse<AuthResponse>;
            return { isSuccess: false, message: "Không thể kết nối đến máy chủ." };
        }
    },

    /**
     * Đăng nhập
     */
    login: async (data: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
        try {
            const response = await axiosInstance.post<ApiResponse<AuthResponse>>(`${AUTH_URL}/login`, data);
            return response.data;
        } catch (error: unknown) {
            if (isAxiosError(error) && error.response?.data) return error.response.data as ApiResponse<AuthResponse>;
            return { isSuccess: false, message: "Không thể kết nối đến máy chủ." };
        }
    },

    /**
     * Làm mới Access Token bằng Refresh Token
     */
    refreshToken: async (data: RefreshTokenRequest): Promise<ApiResponse<TokenResponse>> => {
        try {
            const response = await axiosInstance.post<ApiResponse<TokenResponse>>(`${AUTH_URL}/refresh-token`, data);
            return response.data;
        } catch (error: unknown) {
            if (isAxiosError(error) && error.response?.data) return error.response.data as ApiResponse<TokenResponse>;
            return { isSuccess: false, message: "Không thể kết nối đến máy chủ." };
        }
    },

    /**
     * Quên mật khẩu - Gửi email chứa link/token reset
     */
    forgotPassword: async (data: ForgotPasswordRequest): Promise<ApiResponse> => {
        try {
            const response = await axiosInstance.post<ApiResponse>(`${AUTH_URL}/forgot-password`, data);
            return response.data;
        } catch (error: unknown) {
            if (isAxiosError(error) && error.response?.data) return error.response.data as ApiResponse;
            return { isSuccess: false, message: "Lỗi kết nối đến máy chủ." };
        }
    },

    /**
     * Đặt lại mật khẩu mới
     */
    resetPassword: async (data: ResetPasswordRequest): Promise<ApiResponse> => {
        try {
            const response = await axiosInstance.post<ApiResponse>(`${AUTH_URL}/reset-password`, data);
            return response.data;
        } catch (error: unknown) {
            if (isAxiosError(error) && error.response?.data) return error.response.data as ApiResponse;
            return { isSuccess: false, message: "Lỗi kết nối đến máy chủ." };
        }
    },

    /**
     * Tiện ích: Đăng xuất (Client & Server)
     */
    logout: async () => {
        const refreshToken = localStorage.getItem('refreshToken');

        if (refreshToken) {
            try {
                const requestData: LogoutRequest = { refreshToken };
                await axiosInstance.post<ApiResponse>(`${AUTH_URL}/logout`, requestData);
            } catch (error) {
                console.error("Lỗi khi gọi API đăng xuất (Thu hồi token thất bại):", error);
            }
        }

        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('sessionId');

        window.location.href = '/login';
    }
};

export default authApi;