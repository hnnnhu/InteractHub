// src/components/feed/MediaCarousel.tsx

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PostMediaDto } from '../../api/postApi';

interface MediaCarouselProps {
    mediaItems: PostMediaDto[];
}

const MediaCarousel: React.FC<MediaCarouselProps> = ({ mediaItems }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!mediaItems || mediaItems.length === 0) return null;

    const handlePrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev === 0 ? mediaItems.length - 1 : prev - 1));
    };

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev === mediaItems.length - 1 ? 0 : prev + 1));
    };

    return (
        <div className="relative w-full h-full flex items-center justify-center bg-black/90 group">
            {/* Nơi hiển thị Ảnh/Video */}
            {mediaItems[currentIndex].type === 1 ? ( // 1 = Image
                <img
                    src={mediaItems[currentIndex].mediaUrl}
                    alt={`Media ${currentIndex + 1}`}
                    className="max-w-full max-h-full object-contain transition-opacity duration-300"
                />
            ) : (
                <video
                    src={mediaItems[currentIndex].mediaUrl}
                    controls
                    className="max-w-full max-h-full outline-none"
                />
            )}

            {/* Nút điều hướng (Chỉ hiện khi có > 1 media và hover chuột) */}
            {mediaItems.length > 1 && (
                <>
                    <button
                        onClick={handlePrev}
                        className="absolute left-4 p-2 rounded-full bg-black/50 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 hover:bg-[#4F6BFF] transition-all border border-white/10"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <button
                        onClick={handleNext}
                        className="absolute right-4 p-2 rounded-full bg-black/50 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 hover:bg-[#4F6BFF] transition-all border border-white/10"
                    >
                        <ChevronRight size={24} />
                    </button>

                    {/* Dấu chấm (Dots) */}
                    <div className="absolute bottom-4 flex gap-2">
                        {mediaItems.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-2 rounded-full transition-all ${idx === currentIndex ? 'w-6 bg-[#4F6BFF]' : 'w-2 bg-white/50'
                                    }`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default MediaCarousel;