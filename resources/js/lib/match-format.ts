export const getMatchStatusColor = (status: string): string => {
    switch (status) {
        case 'available':
            return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20';
        case 'confirmed':
            return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20';
        case 'in_progress':
            return 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20';
        case 'completed':
            return 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20';
        case 'cancelled':
            return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20';
        default:
            return 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20';
    }
};

export const getMatchStatusText = (status: string): string => {
    switch (status) {
        case 'available':
            return 'Disponible';
        case 'confirmed':
            return 'Confirmado';
        case 'in_progress':
            return 'En Vivo';
        case 'completed':
            return 'Completado';
        case 'cancelled':
            return 'Cancelado';
        default:
            return status;
    }
};

export const formatMatchDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
};

export const formatMatchTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
        hour: 'numeric',
        minute: '2-digit',
    });
};
