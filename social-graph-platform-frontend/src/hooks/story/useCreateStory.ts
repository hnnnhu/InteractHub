// src/hooks/story/useCreateStory.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { storyApi } from '../../api/storyApi';
import { postApi } from '../../api/postApi';
import type { CreateStoryDto } from '../../types/story';
import { MediaType, PrivacyLevel } from '../../types/story';

interface CreateStoryInput {
    content?: string;
    mediaFile?: File;
    privacy?: number;
    durationHours?: number;
}

export function useCreateStory() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (data: CreateStoryInput): Promise<{ id: string }> => {
            let mediaUrl = '';
            let mediaType: MediaType = MediaType.None;

            if (data.mediaFile) {
                const urls = await postApi.uploadMedia([data.mediaFile]);
                if (urls.length > 0) {
                    mediaUrl = urls[0];
                    mediaType = (
                        data.mediaFile.type.startsWith('video')
                            ? MediaType.Video
                            : MediaType.Image
                    ) as MediaType;
                } else {
                    throw new Error('Upload không thành công');
                }
            }

            const dto: CreateStoryDto = {
                content: data.content ?? null,
                mediaUrl,
                type: mediaType,
                privacy: (data.privacy ?? PrivacyLevel.Public) as PrivacyLevel,
                durationHours: data.durationHours ?? 24,
            };

            const response = await storyApi.createStory(dto);
            if (!response.isSuccess) {
                throw new Error(response.message || 'Tạo story thất bại');
            }
            return { id: response.data?.id ?? '' };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stories', 'me'] });
            queryClient.invalidateQueries({ queryKey: ['stories', 'feed'] });
        },
    });

    return {
        createStory: mutation.mutateAsync,
        loading: mutation.isPending,
        error: mutation.error?.message ?? null,
        success: mutation.isSuccess,
    };
}