import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PostDetailModal from '../components/feed/PostDetailModal';

const PostPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const handleClose = () => {
        navigate(-1); // quay về trang trước đó
    };

    if (!id) {
        return <div className="text-white text-center pt-20">Không tìm thấy bài viết</div>;
    }

    return (
        <PostDetailModal
            isOpen={true}
            postId={id}
            onClose={handleClose}
        />
    );
};

export default PostPage;