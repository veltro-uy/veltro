import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';

interface VariantBadgeProps {
    variant: string;
}

const variantConfig = {
    football_11: {
        label: 'Fútbol 11',
        color: 'bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
    },
    football_7: {
        label: 'Fútbol 7',
        color: 'bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400',
    },
    football_5: {
        label: 'Fútbol 5',
        color: 'bg-purple-100 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400',
    },
    futsal: {
        label: 'Futsal',
        color: 'bg-orange-100 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400',
    },
};

export function VariantBadge({ variant }: VariantBadgeProps) {
    const config = variantConfig[variant as keyof typeof variantConfig] || {
        label: variant,
        color: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
    };

    return (
        <Badge variant="secondary" className={config.color}>
            <Trophy className="mr-1 h-3 w-3" />
            {config.label}
        </Badge>
    );
}
