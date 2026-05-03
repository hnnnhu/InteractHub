// src/utils/renderContentWithHighlights.tsx
import React from 'react';
import { Link } from 'react-router-dom';

export const renderContentWithHighlights = (text?: string) => {
    if (!text) return null;

    // Regex bắt cả #hashtag và @mention (hỗ trợ Unicode)
    const regex = /(#[\p{L}\p{N}_]+|@[\p{L}\p{N}_.]+)/gu;
    const parts = text.split(regex);

    // Bọc toàn bộ trong một thẻ cha (ở đây dùng React.Fragment với key để tránh lỗi ref)
    // Fragment trống không nhận ref, nhưng chúng ta không truyền ref vào hàm này, nên an toàn.
    // Nếu bạn muốn chắc chắn tuyệt đối, dùng <span>...</span> thay vì Fragment.
    return (
        <>
            {parts.map((part, i) => {
                if (part.startsWith('#')) {
                    const cleanName = part.replace(/^#/, '');
                    return (
                        <Link
                            key={i}
                            to={`/hashtag/${encodeURIComponent(cleanName)}`}
                            className="text-[#4F6BFF] hover:text-white cursor-pointer font-bold transition-colors hover:underline"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {part}
                        </Link>
                    );
                }
                if (part.startsWith('@')) {
                    const username = part.replace(/^@/, '');
                    return (
                        <Link
                            key={i}
                            to={`/profile/${username}`}
                            className="text-[#4F6BFF] hover:text-white cursor-pointer font-bold transition-colors hover:underline"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {part}
                        </Link>
                    );
                }
                // Với các đoạn text thông thường, dùng span hoặc React.Fragment
                // React.Fragment không thể nhận ref, nhưng ở đây nó là phần tử con trong map,
                // không bị forward ref từ đâu cả, nên an toàn.
                return <React.Fragment key={i}>{part}</React.Fragment>;
            })}
        </>
    );
};