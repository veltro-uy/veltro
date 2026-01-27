import { UserAvatar } from '@/components/user-avatar';
import { UserNameLink } from '@/components/user-name-link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePage } from '@inertiajs/react';
import type { ProfileComment, SharedData } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface ProfileCommentsProps {
    userId: number;
    onCommentDeleted?: () => void;
}

interface PaginatedResponse {
    data: ProfileComment[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export function ProfileComments({
    userId,
    onCommentDeleted,
}: ProfileCommentsProps) {
    const { auth } = usePage<SharedData>().props;
    const [comments, setComments] = useState<ProfileComment[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const fetchComments = useCallback(
        async (page: number = 1, append: boolean = false) => {
            if (append) {
                setLoadingMore(true);
            } else {
                setLoading(true);
            }

            try {
                const response = await fetch(
                    `/api/users/${userId}/comments?page=${page}`,
                );
                if (!response.ok) {
                    throw new Error('Error al cargar comentarios');
                }
                const data: PaginatedResponse = await response.json();

                if (append) {
                    setComments((prev) => [...prev, ...data.data]);
                } else {
                    setComments(data.data);
                }

                setCurrentPage(data.current_page);
                setLastPage(data.last_page);
            } catch (error) {
                console.error('Error fetching comments:', error);
                toast.error('Error al cargar comentarios');
            } finally {
                setLoading(false);
                setLoadingMore(false);
            }
        },
        [userId],
    );

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    const handleDelete = async (commentId: number) => {
        if (
            !confirm('¿Estás seguro de que quieres eliminar este comentario?')
        ) {
            return;
        }

        setDeletingId(commentId);

        try {
            const response = await fetch(`/api/comments/${commentId}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') || '',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al eliminar');
            }

            setComments((prev) => prev.filter((c) => c.id !== commentId));
            toast.success('Comentario eliminado exitosamente');

            if (onCommentDeleted) {
                onCommentDeleted();
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'Error al eliminar comentario',
            );
        } finally {
            setDeletingId(null);
        }
    };

    const loadMore = () => {
        if (currentPage < lastPage && !loadingMore) {
            fetchComments(currentPage + 1, true);
        }
    };

    const canDelete = (comment: ProfileComment) => {
        if (!auth?.user) return false;
        return (
            comment.user_id === auth.user.id ||
            comment.profile_user_id === auth.user.id
        );
    };

    const formatDate = (dateString: string) => {
        try {
            return formatDistanceToNow(new Date(dateString), {
                addSuffix: true,
                locale: es,
            });
        } catch {
            return dateString;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (comments.length === 0) {
        return (
            <p className="py-8 text-center text-sm text-muted-foreground">
                No hay comentarios todavía
            </p>
        );
    }

    return (
        <div className="space-y-3">
            {comments.map((comment) => (
                <Card key={comment.id} className="p-4">
                    <div className="flex gap-3">
                        <UserAvatar
                            name={comment.author?.name || 'Usuario'}
                            avatarUrl={comment.author?.avatar_url}
                            size="sm"
                            className="h-10 w-10"
                        />
                        <div className="flex-1 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    {comment.author && (
                                        <UserNameLink user={comment.author} />
                                    )}
                                    <span className="text-xs text-muted-foreground">
                                        {formatDate(comment.created_at)}
                                    </span>
                                </div>
                                {canDelete(comment) && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(comment.id)}
                                        disabled={deletingId === comment.id}
                                        className="h-auto p-1"
                                    >
                                        {deletingId === comment.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                        )}
                                    </Button>
                                )}
                            </div>
                            <p className="whitespace-pre-wrap text-sm">
                                {comment.comment}
                            </p>
                        </div>
                    </div>
                </Card>
            ))}

            {currentPage < lastPage && (
                <Button
                    variant="outline"
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="w-full"
                >
                    {loadingMore ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Cargando...
                        </>
                    ) : (
                        'Cargar más comentarios'
                    )}
                </Button>
            )}
        </div>
    );
}
