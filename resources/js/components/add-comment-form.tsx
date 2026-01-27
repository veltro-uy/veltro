import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { ProfileComment, SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface AddCommentFormProps {
    userId: number;
    onCommentAdded?: (comment: ProfileComment) => void;
}

export function AddCommentForm({
    userId,
    onCommentAdded,
}: AddCommentFormProps) {
    const { auth } = usePage<SharedData>().props;
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Don't show form if not authenticated or if user is viewing their own profile
    if (!auth?.user || auth.user.id === userId) {
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!comment.trim()) {
            toast.error('El comentario no puede estar vacío');
            return;
        }

        if (comment.length > 1000) {
            toast.error('El comentario no puede exceder los 1000 caracteres');
            return;
        }

        setSubmitting(true);

        try {
            const response = await fetch(`/api/users/${userId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') || '',
                },
                body: JSON.stringify({ comment: comment.trim() }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al publicar');
            }

            const data = await response.json();

            toast.success('Comentario publicado exitosamente');
            setComment('');

            if (onCommentAdded && data.comment) {
                onCommentAdded(data.comment);
            }
        } catch (error) {
            console.error('Error submitting comment:', error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'Error al publicar comentario',
            );
        } finally {
            setSubmitting(false);
        }
    };

    const remainingChars = 1000 - comment.length;
    const isOverLimit = remainingChars < 0;

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-2">
                <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Escribe un comentario..."
                    rows={3}
                    disabled={submitting}
                    className={isOverLimit ? 'border-destructive' : ''}
                />
                <div className="flex items-center justify-between">
                    <span
                        className={`text-xs ${
                            isOverLimit
                                ? 'text-destructive'
                                : remainingChars < 100
                                  ? 'text-yellow-500'
                                  : 'text-muted-foreground'
                        }`}
                    >
                        {remainingChars} caracteres restantes
                    </span>
                    <Button
                        type="submit"
                        size="sm"
                        disabled={!comment.trim() || isOverLimit || submitting}
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Publicando...
                            </>
                        ) : (
                            'Publicar comentario'
                        )}
                    </Button>
                </div>
            </div>
        </form>
    );
}
