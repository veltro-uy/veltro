import { Share2 } from 'lucide-react';
import type { ComponentProps } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useClipboard } from '@/hooks/use-clipboard';

interface ShareButtonProps extends Omit<
    ComponentProps<typeof Button>,
    'children' | 'onClick'
> {
    title: string;
    text?: string;
    url?: string;
    label?: string;
}

export function ShareButton({
    title,
    text,
    url,
    label = 'Compartir',
    variant = 'outline',
    ...props
}: ShareButtonProps) {
    const [, copy] = useClipboard();

    const handleShare = async () => {
        const shareUrl = url ?? window.location.href;

        if (navigator.share) {
            try {
                await navigator.share({ title, text, url: shareUrl });
                return;
            } catch (error) {
                if (
                    error instanceof DOMException &&
                    error.name === 'AbortError'
                ) {
                    return;
                }
            }
        }

        if (await copy(shareUrl)) {
            toast.success('Enlace copiado');
        } else {
            toast.error('No se pudo compartir el enlace');
        }
    };

    return (
        <Button
            type="button"
            variant={variant}
            onClick={() => void handleShare()}
            {...props}
        >
            <Share2 className="mr-2 size-4" />
            {label}
        </Button>
    );
}
