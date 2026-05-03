// src/hooks/story/useStoryViewer.ts
import { useState, useCallback, useMemo } from 'react';
import { storyApi } from '../../api/storyApi';
import type { ActiveStoryDto } from '../../types/story';

interface UseStoryViewerProps {
    feed: ActiveStoryDto[];
    initialUserIndex?: number;
    initialStoryIndex?: number;
    onClose?: () => void;
    currentUserId?: string;
}

export function useStoryViewer({
    feed,
    initialUserIndex = 0,
    initialStoryIndex = 0,
    onClose,
    currentUserId,
}: UseStoryViewerProps) {
    const [visible, setVisible] = useState(false);
    const [userIndex, setUserIndex] = useState(initialUserIndex);
    const [storyIndex, setStoryIndex] = useState(initialStoryIndex);
    const [internalFeed, setInternalFeed] = useState<ActiveStoryDto[]>(feed);

    const currentUser = useMemo(
        () => internalFeed[userIndex] ?? null,
        [internalFeed, userIndex]
    );

    const currentStory = useMemo(() => {
        if (!currentUser) return null;
        const idx = Math.min(storyIndex, currentUser.stories.length - 1);
        return currentUser.stories[idx];
    }, [currentUser, storyIndex]);

    const closeViewer = useCallback(() => {
        setVisible(false);
        onClose?.();
    }, [onClose]);

    const markCurrentAsViewed = useCallback(async () => {
        if (currentStory && currentStory.userId !== currentUserId) {
            try {
                await storyApi.markAsViewed(currentStory.id);
            } catch {
                // silent
            }
        }
    }, [currentStory, currentUserId]);

    const nextStory = useCallback(async () => {
        if (!currentUser) return;
        await markCurrentAsViewed();
        if (storyIndex < currentUser.stories.length - 1) {
            setStoryIndex((prev) => prev + 1);
        } else if (userIndex < internalFeed.length - 1) {
            setUserIndex((prev) => prev + 1);
            setStoryIndex(0);
        } else {
            closeViewer();
        }
    }, [
        currentUser,
        storyIndex,
        userIndex,
        internalFeed.length,
        markCurrentAsViewed,
        closeViewer,
    ]);

    const prevStory = useCallback(() => {
        if (storyIndex > 0) {
            setStoryIndex((prev) => prev - 1);
        } else if (userIndex > 0) {
            setUserIndex((prev) => prev - 1);
            setStoryIndex(internalFeed[userIndex - 1].stories.length - 1);
        }
    }, [storyIndex, userIndex, internalFeed]);

    const open = useCallback(
        (index: number, storyIdx = 0) => {
            setInternalFeed(feed);
            setUserIndex(index);
            setStoryIndex(storyIdx);
            setVisible(true);
        },
        [feed]
    );

    const openUser = useCallback(
        (user: ActiveStoryDto, storyIdx = 0) => {
            setInternalFeed([user]);
            setUserIndex(0);
            setStoryIndex(storyIdx);
            setVisible(true);
        },
        []
    );

    return {
        visible,
        currentUser,
        currentStoryIndex: storyIndex,
        currentStory,
        nextStory,
        prevStory,
        close: closeViewer,
        open,
        openUser,
    } as const;
}