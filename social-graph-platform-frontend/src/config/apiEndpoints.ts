// config/apiEndpoints.ts

/**
 * Cấu hình tập trung tất cả endpoint của dự án.
 * Mỗi endpoint được định nghĩa dưới dạng hằng số chuỗi hoặc hàm trả về chuỗi (nếu có tham số động).
 */
export const API_ENDPOINTS = {
    // ── Auth ─────────────────────────────────────────────────────────────
    AUTH: {
        BASE: '/auth',
        REGISTER: '/auth/register',
        LOGIN: '/auth/login',
        REFRESH_TOKEN: '/auth/refresh-token',
        FORGOT_PASSWORD: '/auth/forgot-password',
        RESET_PASSWORD: '/auth/reset-password',
        LOGOUT: '/auth/logout',
    },

    // ── Users ────────────────────────────────────────────────────────────
    USERS: {
        BASE: '/users',
        ME: '/users/me',
        PROFILE: '/users/profile', // + /{username}
        SEARCH: '/users/search',
        GET_BY_ID: (userId: string) => `/users/${userId}`,
        STATS: (userId: string) => `/users/${userId}/stats`,
        UPDATE_PROFILE: '/users/profile',
        CHANGE_PASSWORD: '/users/change-password',
        AVATAR: '/users/me/avatar',
        COVER_PHOTO: '/users/me/cover-photo',
        SESSIONS: '/users/me/sessions',
        REVOKE_SESSION: (sessionId: string) => `/users/me/sessions/${sessionId}`,
        LOGOUT_OTHERS: '/users/me/logout-others',
        LOGOUT_ALL: '/users/me/logout-all',
        TWO_FACTOR_SETUP: '/users/me/2fa/setup',
        TWO_FACTOR_ENABLE: '/users/me/2fa/enable',
        TWO_FACTOR_DISABLE: '/users/me/2fa/disable',
        RECOVERY_CODES: '/users/me/2fa/recovery-codes',
        PRIVACY: '/users/me/privacy',
        DEACTIVATE: '/users/deactivate',
        RESTORE: '/users/me/restore',
    },

    // ── Posts ────────────────────────────────────────────────────────────
    POSTS: {
        BASE: '/posts',
        FEED: '/posts/feed',
        SEARCH: '/posts/search',
        USER_POSTS: (userId: string) => `/posts/user/${userId}`,
        GET_BY_ID: (postId: string) => `/posts/${postId}`,
        CREATE: '/posts',
        UPDATE: (postId: string) => `/posts/${postId}`,
        DELETE: (postId: string) => `/posts/${postId}`,
    },

    // ── Media ────────────────────────────────────────────────────────────
    MEDIA: {
        UPLOAD: '/media/upload',
    },

    // ── Comments ─────────────────────────────────────────────────────────
    COMMENTS: {
        BASE: '/comments',
        POST_COMMENTS: (postId: string) => `/comments/post/${postId}`,
        REPLIES: (commentId: string) => `/comments/${commentId}/replies`,
        UPDATE: (commentId: string) => `/comments/${commentId}`,
        DELETE: (commentId: string) => `/comments/${commentId}`,
    },

    // ── Reactions ────────────────────────────────────────────────────────
    REACTIONS: {
        BASE: '/reactions',
        POST_SUMMARY: (postId: string) => `/reactions/post/${postId}/summary`,
        POST_USERS: (postId: string) => `/reactions/post/${postId}/users`,
        REMOVE: (postId: string) => `/reactions/post/${postId}`,
    },

    // ── Saved Posts ──────────────────────────────────────────────────────
    SAVED_POSTS: {
        BASE: '/saved-posts',
        TOGGLE: (postId: string) => `/saved-posts/post/${postId}`,
        COLLECTIONS: '/saved-posts/collections',
        COLLECTION_BY_NAME: (name: string) => `/saved-posts/collections/${encodeURIComponent(name)}`,
    },

    // ── Blocks ───────────────────────────────────────────────────────────
    BLOCKS: {
        BASE: '/blocks',
        BLOCK: '/blocks',
        UNBLOCK: (blockedId: string) => `/blocks/${blockedId}`,
        STATUS: (targetUserId: string) => `/blocks/${targetUserId}/status`,
    },

    // ── Reports ──────────────────────────────────────────────────────────
    REPORTS: {
        BASE: '/reports',
        REASONS: '/reports/reasons',
        MY_REPORTS: '/reports/me',
        DETAIL: (reportId: string) => `/reports/${reportId}`,
        RESOLVE: (reportId: string) => `/reports/${reportId}/resolve`,
        REVIEW: (reportId: string) => `/reports/${reportId}/review`,
        DISMISS: (reportId: string) => `/reports/${reportId}/dismiss`,
    },

    // ── Friendships ──────────────────────────────────────────────────────
    FRIENDSHIPS: {
        BASE: '/friendships',
        REQUESTS: '/friendships/requests',
        PENDING_REQUESTS: '/friendships/requests/pending',
        SENT_REQUESTS: '/friendships/requests/sent',
        ACCEPT_REQUEST: (friendshipId: string) => `/friendships/requests/${friendshipId}/accept`,
        REJECT_REQUEST: (friendshipId: string) => `/friendships/requests/${friendshipId}/reject`,
        CANCEL_REQUEST: (friendshipId: string) => `/friendships/requests/${friendshipId}/cancel`,
        USER_FRIENDS: (userId: string) => `/friendships/user/${userId}`,
        FRIEND_COUNT: (userId: string) => `/friendships/user/${userId}/count`,
        SUGGESTIONS: '/friendships/suggestions',
        UNFRIEND: (friendId: string) => `/friendships/friends/${friendId}`,
    },

    // ── Hashtags ─────────────────────────────────────────────────────────
    HASHTAGS: {
        BASE: '/hashtags',
        TRENDING: '/hashtags/trending',
        GET_BY_NAME: (name: string) => `/hashtags/${encodeURIComponent(name.replace(/^#/, ''))}`,
        DELETE: (name: string) => `/hashtags/${encodeURIComponent(name.replace(/^#/, ''))}`,
    },

    // ── Notifications ────────────────────────────────────────────────────
    NOTIFICATIONS: {
        BASE: '/notifications',
        GET_BY_ID: (notificationId: string) => `/notifications/${notificationId}`,
        UNREAD_COUNT: '/notifications/unread-count',
        MARK_AS_READ: '/notifications/read',
        CLEANUP: '/notifications/cleanup',
        SETTINGS: '/notifications/settings', // nếu có controller riêng
        BULK_CREATE: '/notifications/bulk',
    },
} as const;