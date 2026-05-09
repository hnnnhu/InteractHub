// src/components/story/StoryViewer.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Pause } from 'lucide-react';
import { StoryViewerHeader } from './StoryViewerHeader';
import { StoryViewerProgress } from './StoryViewerProgress';
import { StoryViewersList } from './StoryViewersList';
import type { ActiveStoryDto, StoryResponseDto } from '../../types/story';
import { storyApi } from '../../api/storyApi'; // API để gọi markAsViewed

interface StoryViewerProps {
    currentUser: ActiveStoryDto | null;
    currentStoryIndex: number;
    currentStory: StoryResponseDto | null;
    currentUserId?: string;
    onNext: () => void;
    onPrev: () => void;
    onClose: () => void;
}

const STORY_DURATION_MS = 5000;
const SWIPE_THRESHOLD = 50;

/**
 * StoryViewerContent – nội dung thực của trình xem story.
 * Được remount khi currentStory.id thay đổi (qua key).
 */
const StoryViewerContent: React.FC<StoryViewerProps> = ({
    currentUser,
    currentStoryIndex,
    currentStory,
    currentUserId,
    onNext,
    onPrev,
    onClose,
}) => {
    const [progress, setProgress] = useState(0);
    const [paused, setPaused] = useState(false);
    const [showViewers, setShowViewers] = useState(false);
    const [showPauseIcon, setShowPauseIcon] = useState(false);
    const [videoEnded, setVideoEnded] = useState(false);

    const animationFrameRef = useRef<number>(0);
    const startTimeRef = useRef<number>(0);
    const touchStartX = useRef(0);
    const videoRef = useRef<HTMLVideoElement>(null);

    // So sánh không phân biệt chữ hoa/thường để xác định chủ sở hữu story
    const isOwner =
        currentUserId != null &&
        currentStory?.userId?.toLowerCase() === currentUserId.toLowerCase();
    const isVideo = currentStory?.type === 2;

    // ──────────────────────────────────────
    // TỰ ĐỘNG GHI NHẬN LƯỢT XEM khi story hiển thị
    // ──────────────────────────────────────
    useEffect(() => {
        const safeCurrentUserId = currentUserId?.toLowerCase() || '';
        const safeStoryUserId = currentStory?.userId?.toLowerCase() || '';

        // Chỉ tính view nếu có ID và người xem KHÁC chủ story
        if (currentStory && safeCurrentUserId !== '' && safeStoryUserId !== safeCurrentUserId) {
            storyApi.markAsViewed(currentStory.id).then((res) => {
                if (!res.isSuccess) {
                    console.error('❌ Lỗi Backend khi đếm view:', res.message);
                } else {
                    console.log('✅ Đã đếm view thành công cho story:', currentStory.id);
                }
            });
        }
    }, [currentStory?.id, currentUserId, currentStory?.userId]);

    // ──────────────────────────────────────
    // Tiến trình cho story dạng ảnh
    // ──────────────────────────────────────
    useEffect(() => {
        if (!currentStory || isVideo || paused) {
            cancelAnimationFrame(animationFrameRef.current);
            return;
        }

        startTimeRef.current = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTimeRef.current;
            const newProgress = Math.min((elapsed / STORY_DURATION_MS) * 100, 100);
            setProgress(newProgress);
            if (newProgress >= 100) {
                cancelAnimationFrame(animationFrameRef.current);
                onNext();
                return;
            }
            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animationFrameRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrameRef.current);
    }, [currentStory, isVideo, paused, onNext]);

    // ──────────────────────────────────────
    // Pause / Resume
    // ──────────────────────────────────────
    const pauseStory = useCallback(() => {
        setPaused(true);
        setShowPauseIcon(true);
        if (videoRef.current && !videoRef.current.paused) {
            videoRef.current.pause();
        }
    }, []);

    const resumeStory = useCallback(() => {
        setPaused(false);
        setShowPauseIcon(false);
        if (videoRef.current && videoRef.current.paused && !videoEnded) {
            videoRef.current.play().catch(() => { });
        }
    }, [videoEnded]);

    const handlePointerDown = useCallback(() => pauseStory(), [pauseStory]);
    const handlePointerUp = useCallback(() => resumeStory(), [resumeStory]);
    const handlePointerLeave = useCallback(() => resumeStory(), [resumeStory]);

    const handleTouchStart = useCallback(
        (e: React.TouchEvent) => {
            touchStartX.current = e.touches[0].clientX;
            pauseStory();
        },
        [pauseStory]
    );

    const handleTouchEnd = useCallback(
        (e: React.TouchEvent) => {
            resumeStory();
            const diff = e.changedTouches[0].clientX - touchStartX.current;
            if (Math.abs(diff) > SWIPE_THRESHOLD) {
                if (diff > 0) onPrev();
                else onNext();
            }
        },
        [resumeStory, onPrev, onNext]
    );

    // ──────────────────────────────────────
    // Phím tắt
    // ──────────────────────────────────────
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') onNext();
            else if (e.key === 'ArrowLeft') onPrev();
            else if (e.key === 'Escape') onClose();
            else if (e.key === ' ') {
                e.preventDefault();
                if (paused) resumeStory();
                else pauseStory();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onNext, onPrev, onClose, paused, pauseStory, resumeStory]);

    if (!currentUser || !currentStory) return null;

    const formatTime = (seconds: number): string => {
        if (seconds <= 0) return 'Hết hạn';
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        if (hrs > 0) return `${hrs} giờ`;
        if (mins > 0) return `${mins} phút`;
        return `${Math.floor(seconds)} giây`;
    };

    return (
        <div
            className="fixed inset-0 bg-black flex flex-col select-none touch-none"
            style={{ zIndex: 9999, height: '100dvh' }}
            role="dialog"
            aria-modal="true"
            aria-label={`Story của ${currentUser.fullName}`}
        >
            {/* Progress bar */}
            <div className="absolute top-0 left-0 right-0 z-30 px-2 py-2 safe-area-top">
                <div className="flex gap-1">
                    {currentUser.stories.map((story, idx) => (
                        <StoryViewerProgress
                            key={story.id}
                            active={idx === currentStoryIndex}
                            progress={
                                idx < currentStoryIndex
                                    ? 100
                                    : idx === currentStoryIndex
                                        ? progress
                                        : 0
                            }
                            paused={paused && idx === currentStoryIndex}
                        />
                    ))}
                </div>
            </div>

            {/* Header */}
            <div className="absolute top-10 left-0 right-0 z-30 px-4">
                <StoryViewerHeader
                    avatarUrl={currentUser.avatarUrl || '/default-avatar.png'}
                    fullName={currentUser.fullName}
                    timeText={
                        currentStory.isExpired
                            ? 'Đã hết hạn'
                            : formatTime(currentStory.secondsRemaining)
                    }
                    onClose={onClose}
                    onViewersClick={isOwner ? () => setShowViewers(true) : undefined}
                    viewCount={isOwner ? (currentStory.viewCount || 0) : undefined}
                />
            </div>

            {/* Nội dung media */}
            <div
                className="absolute inset-0 z-10"
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerLeave}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                <div className="mx-auto w-full h-full max-w-[480px] bg-black overflow-hidden relative">
                    {isVideo ? (
                        <video
                            ref={videoRef}
                            src={currentStory.mediaUrl || ''}
                            className="w-full h-full object-cover"
                            autoPlay
                            muted
                            playsInline
                            preload="auto"
                            onEnded={() => {
                                setVideoEnded(true);
                                onNext();
                            }}
                            onPlay={() => setPaused(false)}
                            onPause={() => setPaused(true)}
                            onError={(e) => {
                                console.error('Video load error:', e);
                            }}
                        />
                    ) : (
                        <img
                            src={currentStory.mediaUrl || ''}
                            alt="story"
                            className="w-full h-full object-cover"
                            draggable={false}
                        />
                    )}
                </div>

                {/* Caption */}
                {currentStory.content && (
                    <div className="absolute bottom-8 left-4 right-4 max-w-[480px] mx-auto z-20">
                        <p className="bg-black/40 backdrop-blur-md text-white px-5 py-3 rounded-2xl text-center text-sm sm:text-base line-clamp-2">
                            {currentStory.content}
                        </p>
                    </div>
                )}

                {/* Pause indicator */}
                {showPauseIcon && (
                    <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none animate-in fade-in duration-150">
                        <div className="bg-black/50 rounded-full p-4">
                            <Pause className="w-8 h-8 text-white" fill="white" />
                        </div>
                    </div>
                )}
            </div>

            {/* Tap zones */}
            <div className="absolute inset-0 z-15 flex pointer-events-none">
                <button
                    className="w-[35%] h-full pointer-events-auto cursor-default"
                    onClick={(e) => {
                        e.stopPropagation();
                        onPrev();
                    }}
                    aria-label="Story trước"
                />
                <div className="flex-1" />
                <button
                    className="w-[35%] h-full pointer-events-auto cursor-default"
                    onClick={(e) => {
                        e.stopPropagation();
                        onNext();
                    }}
                    aria-label="Story tiếp theo"
                />
            </div>

            {/* Desktop navigation */}
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    onPrev();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-30 hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-black/40 text-white hover:bg-black/60 transition-all backdrop-blur-sm opacity-0 group-hover/viewer:opacity-100"
                aria-label="Story trước"
            >
                <ChevronLeft className="w-5 h-5" />
            </button>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    onNext();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-30 hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-black/40 text-white hover:bg-black/60 transition-all backdrop-blur-sm opacity-0 group-hover/viewer:opacity-100"
                aria-label="Story tiếp theo"
            >
                <ChevronRight className="w-5 h-5" />
            </button>

            {/* Danh sách người xem */}
            {showViewers && (
                <StoryViewersList
                    storyId={currentStory.id}
                    onClose={() => setShowViewers(false)}
                />
            )}
        </div>
    );
};

/**
 * StoryViewer – wrapper render qua portal.
 * Remount khi currentStory.id thay đổi nhờ key.
 */
export const StoryViewer: React.FC<StoryViewerProps> = (props) => {
    if (!props.currentUser || !props.currentStory) return null;
    return createPortal(
        <StoryViewerContent key={props.currentStory.id} {...props} />,
        document.body
    );
};