// src/hooks/story/useStoryAutoRefresh.ts
import { useEffect, useRef } from 'react';

export function useStoryAutoRefresh(
    refresh: () => void,
    intervalMs = 30000
) {
    const refreshRef = useRef(refresh);

    useEffect(() => {
        refreshRef.current = refresh;
    }, [refresh]);

    useEffect(() => {
        const timer = setInterval(() => {
            refreshRef.current();
        }, intervalMs);
        return () => clearInterval(timer);
    }, [intervalMs]);
}