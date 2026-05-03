// components/notification/NotificationDropdown.tsx

import React, { useState, useRef, useEffect } from 'react';
import NotificationBadge from './NotificationBadge';
import NotificationList from './NotificationList';
import { useNavigate } from 'react-router-dom';
import type { NotificationResponseDto } from '../../types/notification';

const NotificationDropdown: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [filter, setFilter] = useState<{ type?: number; unreadOnly?: boolean }>({});
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Đóng dropdown khi click bên ngoài
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleBadgeClick = () => {
        setIsOpen((prev) => !prev);
        if (!isOpen) setFilter({});
    };

    const handleNotificationClick = (notification: NotificationResponseDto) => {
        setIsOpen(false);
        if (notification.targetUrl) {
            navigate(notification.targetUrl);
        } else {
            navigate(`/notifications/${notification.id}`);
        }
    };

    return (
        <div className="relative inline-block" ref={dropdownRef}>
            <NotificationBadge onClick={handleBadgeClick} />

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl ring-1 ring-black/5 z-50 origin-top-right transition-all duration-200 overflow-hidden">
                    {/* Quick filters */}
                    <div className="flex gap-1 px-4 py-2 border-b border-gray-100 bg-gray-50/50">
                        <button
                            onClick={() => setFilter({ unreadOnly: true })}
                            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${filter.unreadOnly ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            Chưa đọc
                        </button>
                        <button
                            onClick={() => setFilter({})}
                            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${!filter.unreadOnly && !filter.type ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            Tất cả
                        </button>
                    </div>

                    {/* Notification list */}
                    <NotificationList
                        typeFilter={filter.type}
                        unreadOnly={filter.unreadOnly}
                        onNotificationClick={handleNotificationClick}
                    />

                    {/* Footer - View all */}
                    <div className="border-t border-gray-100 p-2 text-center">
                        <button
                            onClick={() => {
                                navigate('/notifications');
                                setIsOpen(false);
                            }}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                            Xem tất cả thông báo
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;