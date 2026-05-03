// src/components/hashtag/HashtagLink.tsx

import React from 'react';
import { Link } from 'react-router-dom'; // Giả định bạn dùng react-router-dom

interface HashtagLinkProps {
    name: string;
    className?: string;
}

export const HashtagLink: React.FC<HashtagLinkProps> = ({ name, className = '' }) => {
    // Loại bỏ dấu # nếu có để đảm bảo an toàn cho URL
    const cleanName = name.replace(/^#/, '');

    return (
        <Link
            to={`/hashtag/${encodeURIComponent(cleanName)}`}
            className={`font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200 ${className}`}
            onClick={(e) => e.stopPropagation()} // Tránh kích hoạt sự kiện click của thẻ cha (ví dụ: click vào bài viết)
        >
            #{cleanName}
        </Link>
    );
};

export default HashtagLink;