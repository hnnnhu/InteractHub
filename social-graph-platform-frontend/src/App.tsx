// src/App.tsx
import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationProvider';
import MainLayout from './components/layout/MainLayout';
import AdminLayout from './components/admin/AdminLayout';
import AdminGuard from './components/common/AdminGuard';

// Lazy imports (giữ nguyên danh sách của bạn)
const Login = React.lazy(() => import('./pages/auth/Login'));
const Register = React.lazy(() => import('./pages/auth/Register'));
const ForgotPassword = React.lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./pages/auth/ResetPassword'));

const Feed = React.lazy(() => import('./pages/Feed'));
const ExplorePage = React.lazy(() => import('./pages/ExplorePage'));
const SavedPostsPage = React.lazy(() => import('./pages/SavedPostsPage'));
const HashtagSearch = React.lazy(() => import('./pages/HashtagSearch'));
const HashtagPage = React.lazy(() => import('./pages/HashtagPage'));

const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const EditProfilePage = React.lazy(() => import('./pages/EditProfilePage'));

const SearchPage = React.lazy(() => import('./pages/SearchPage'));
const SearchUsersPage = React.lazy(() => import('./pages/SearchUsersPage'));

const FriendsPage = React.lazy(() => import('./pages/FriendsPage'));
const FriendRequestsPage = React.lazy(() => import('./pages/FriendRequestsPage'));

const NotificationsPage = React.lazy(() => import('./pages/NotificationsPage'));

const SettingsLayout = React.lazy(() => import('./pages/settings/SettingsLayout'));
const PrivacyPage = React.lazy(() => import('./pages/settings/PrivacyPage'));
const BlockedUsersPage = React.lazy(() => import('./pages/settings/BlockedUsersPage'));
const SecurityPage = React.lazy(() => import('./pages/settings/SecurityPage'));

// Admin pages
const AdminDashboardPage = React.lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminUsersPage = React.lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminUserDetailPage = React.lazy(() => import('./pages/admin/AdminUserDetailPage'));
const AdminPostsPage = React.lazy(() => import('./pages/admin/AdminPostsPage'));
const AdminReportsPage = React.lazy(() => import('./pages/admin/AdminReportsPage'));

// THÊM: PostPage (chi tiết bài viết từ thông báo)
const PostPage = React.lazy(() => import('./pages/PostPage'));

const queryClient = new QueryClient({
    defaultOptions: {
        queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 5 * 60 * 1000 },
    },
});

const SuspenseFallback = () => (
    <div className="min-h-screen w-full bg-[#0D0C13] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin mb-4 text-[#4F6BFF]" />
        <p className="font-semibold animate-pulse tracking-wide text-gray-400">Đang tải trang...</p>
    </div>
);

// ─────────────────────────────────────────────────────────────
// 1. RootRedirect – điều hướng gốc theo role
// ─────────────────────────────────────────────────────────────
const RootRedirect = () => {
    const { isAuthenticated, isInitialized, roles } = useAuth();

    if (!isInitialized) return <SuspenseFallback />;
    if (!isAuthenticated) return <Navigate to="/login" replace />;

    if (roles?.includes('Admin')) {
        return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/feed" replace />;
};

// ─────────────────────────────────────────────────────────────
// 2. PublicRoute – tôn trọng role khi đã đăng nhập
// ─────────────────────────────────────────────────────────────
const PublicRoute = () => {
    const { isAuthenticated, isInitialized, roles } = useAuth();

    if (!isInitialized) return <SuspenseFallback />;

    if (isAuthenticated) {
        if (roles?.includes('Admin')) {
            return <Navigate to="/admin" replace />;
        }
        return <Navigate to="/feed" replace />;
    }

    return <Outlet />;
};

// ─────────────────────────────────────────────────────────────
// 3. ProtectedRoute (giữ nguyên, không thay đổi)
// ─────────────────────────────────────────────────────────────
const ProtectedRoute = () => {
    const { isAuthenticated, isInitialized } = useAuth();
    if (!isInitialized) return <SuspenseFallback />;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return <Outlet />;
};

// ─────────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────────
const AppRoutes = () => (
    <Suspense fallback={<SuspenseFallback />}>
        <Routes>
            {/* Route gốc – điều hướng thông minh */}
            <Route path="/" element={<RootRedirect />} />

            {/* ==================== ADMIN ROUTES ==================== */}
            <Route element={<AdminGuard />}>
                <Route element={<AdminLayout />}>
                    <Route path="/admin" element={<AdminDashboardPage />} />
                    <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                    <Route path="/admin/users" element={<AdminUsersPage />} />
                    <Route path="/admin/users/:userId" element={<AdminUserDetailPage />} />
                    <Route path="/admin/posts" element={<AdminPostsPage />} />
                    <Route path="/admin/reports" element={<AdminReportsPage />} />
                </Route>
            </Route>

            {/* Public routes */}
            <Route element={<PublicRoute />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
            </Route>

            {/* Protected routes (user thường) */}
            <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                    <Route path="/feed" element={<Feed />} />
                    <Route path="/explore" element={<ExplorePage />} />
                    <Route path="/saved-posts" element={<SavedPostsPage />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/search-users" element={<SearchUsersPage />} />
                    <Route path="/hashtags" element={<HashtagSearch />} />
                    <Route path="/hashtag/:name" element={<HashtagPage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/profile/me" element={<Navigate to="/profile" replace />} />
                    <Route path="/profile/:username" element={<ProfilePage />} />

                    {/* THÊM: Route xem chi tiết bài viết */}
                    <Route path="/post/:id" element={<PostPage />} />

                    <Route path="/settings/profile" element={<EditProfilePage />} />
                    <Route path="/settings" element={<SettingsLayout />}>
                        <Route index element={<Navigate to="/settings/privacy" replace />} />
                        <Route path="privacy" element={<PrivacyPage />} />
                        <Route path="blocked-users" element={<BlockedUsersPage />} />
                        <Route path="security" element={<SecurityPage />} />
                    </Route>
                    <Route path="/friends" element={<FriendsPage />} />
                    <Route path="/friends/requests" element={<FriendRequestsPage />} />
                </Route>
            </Route>

            {/* Trang unauthorized */}
            <Route path="/unauthorized" element={
                <div className="min-h-screen flex items-center justify-center bg-gray-100">
                    <div className="bg-white p-8 rounded shadow text-center">
                        <h1 className="text-2xl font-bold text-red-600 mb-2">Truy cập bị từ chối</h1>
                        <p className="text-gray-600">Bạn không có quyền quản trị để truy cập trang này.</p>
                    </div>
                </div>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    </Suspense>
);

// ─────────────────────────────────────────────────────────────
// App component
// ─────────────────────────────────────────────────────────────
const App: React.FC = () => (
    <QueryClientProvider client={queryClient}>
        <AuthProvider>
            <NotificationProvider>
                <BrowserRouter>
                    <AppRoutes />
                </BrowserRouter>
            </NotificationProvider>
        </AuthProvider>
    </QueryClientProvider>
);

export default App;