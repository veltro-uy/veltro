import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface TeamAvatarProps {
    name: string;
    logoUrl?: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-xl',
    '2xl': 'h-20 w-20 text-xl',
};

export function TeamAvatar({ name, logoUrl, className, size = 'md' }: TeamAvatarProps) {
    const getInitials = (teamName: string) => {
        const words = teamName.trim().split(/\s+/);
        if (words.length >= 2) {
            return `${words[0][0]}${words[1][0]}`.toUpperCase();
        }
        return teamName.slice(0, 2).toUpperCase();
    };

    return (
        <Avatar className={cn(sizeClasses[size], className)}>
            {logoUrl && <AvatarImage src={logoUrl} alt={name} />}
            <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                {getInitials(name)}
            </AvatarFallback>
        </Avatar>
    );
}

