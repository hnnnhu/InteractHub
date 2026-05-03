// src/api/axiosInstance.ts
import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:7042/api';

export const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
});

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value: string | null) => void;
    reject: (reason: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | unknown, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) prom.reject(error);
        else prom.resolve(token);
    });
    failedQueue = [];
};

// ==========================================
// INTERCEPTOR: REQUEST
// ==========================================
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');

        if (config.headers) {
            // Đính kèm Token
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }

            // 🚀 TỰ ĐỘNG GẮN THÔNG TIN THIẾT BỊ (SESSION TRACKING)
            if (typeof navigator !== 'undefined' && navigator.userAgent) {
                config.headers['X-Device-Info'] = navigator.userAgent;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ==========================================
// INTERCEPTOR: RESPONSE (ĐÃ FIX LOOP 401 & TYPES)
// ==========================================
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as CustomAxiosRequestConfig;

        // 1. Nếu không có response (lỗi mạng) hoặc request không tồn tại
        if (!error.response || !originalRequest) return Promise.reject(error);

        // 🚀 BƯỚC CHẶN QUAN TRỌNG: Kiểm tra xem có phải yêu cầu Auth không
        const isAuthEndpoint = originalRequest.url?.includes('/auth/login') ||
            originalRequest.url?.includes('/auth/register') ||
            originalRequest.url?.includes('/auth/refresh-token');

        // 2. Nếu lỗi 401 xảy ra tại các trang Auth (như sai pass) -> TRẢ LỖI THẲNG LUÔN
        if (isAuthEndpoint && error.response.status === 401) {
            return Promise.reject(error);
        }

        // 3. Xử lý Refresh Token cho các lỗi 401 khác (Feed, Profile,...)
        if (error.response.status === 401 && !originalRequest._retry) {

            if (isRefreshing) {
                // Nếu đang có một request khác đi refresh rồi, thì đứng đợi
                return new Promise<string | null>((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        if (token && originalRequest.headers) {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                        }
                        return axiosInstance(originalRequest);
                    })
                    .catch((err: unknown) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const accessToken = localStorage.getItem('accessToken');
            const refreshToken = localStorage.getItem('refreshToken');

            // Nếu không có Token thì logout luôn
            if (!accessToken || !refreshToken) {
                handleLogoutRedirect();
                return Promise.reject(error);
            }

            try {
                // Gọi API refresh bằng AXIOS GỐC để tránh loop Interceptor
                const { data } = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
                    token: accessToken,
                    refreshToken: refreshToken
                }, {
                    headers: {
                        'X-Device-Info': typeof navigator !== 'undefined' ? navigator.userAgent : ''
                    }
                });

                // Lấy Token (Hỗ trợ cả trường hợp bọc trong thuộc tính data)
                const responseData = data?.data || data;
                const newAccessToken = responseData?.accessToken || responseData?.token;
                const newRefreshToken = responseData?.refreshToken;
                const newSessionId = responseData?.sessionId; // Nhận SessionId mới nếu có

                if (!newAccessToken) {
                    throw new Error('Không nhận được token mới từ server');
                }

                // Cập nhật bộ nhớ cục bộ
                localStorage.setItem('accessToken', newAccessToken);
                if (newRefreshToken) {
                    localStorage.setItem('refreshToken', newRefreshToken);
                }
                if (newSessionId) {
                    localStorage.setItem('sessionId', newSessionId);
                }

                axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                }

                // Báo cho các Request đang xếp hàng chạy tiếp
                processQueue(null, newAccessToken);
                return axiosInstance(originalRequest);

            } catch (refreshError: unknown) {
                processQueue(refreshError, null);
                console.warn('Phiên đăng nhập đã hết hạn hoặc bị đăng xuất từ xa. Đang chuyển hướng...');
                handleLogoutRedirect();
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

/**
 * Tiện ích dọn dẹp và chuyển hướng
 */
function handleLogoutRedirect() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('sessionId');

    // Tránh load lại trang nếu đang ở trang login
    if (window.location.pathname !== '/login') {
        window.location.href = '/login?error=session_expired';
    }
}

export default axiosInstance;