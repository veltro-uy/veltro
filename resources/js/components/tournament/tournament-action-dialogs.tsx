import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function TournamentActionDialogs({
    openRegistrationOpen,
    startOpen,
    cancelOpen,
    deleteOpen,
    withdrawOpen,
    onOpenRegistrationOpenChange,
    onStartOpenChange,
    onCancelOpenChange,
    onDeleteOpenChange,
    onWithdrawOpenChange,
    onOpenRegistration,
    onStart,
    onCancel,
    onDelete,
    onWithdraw,
}: {
    openRegistrationOpen: boolean;
    startOpen: boolean;
    cancelOpen: boolean;
    deleteOpen: boolean;
    withdrawOpen: boolean;
    onOpenRegistrationOpenChange: (open: boolean) => void;
    onStartOpenChange: (open: boolean) => void;
    onCancelOpenChange: (open: boolean) => void;
    onDeleteOpenChange: (open: boolean) => void;
    onWithdrawOpenChange: (open: boolean) => void;
    onOpenRegistration: () => void;
    onStart: () => void;
    onCancel: () => void;
    onDelete: () => void;
    onWithdraw: () => void;
}) {
    return (
        <>
            <AlertDialog
                open={openRegistrationOpen}
                onOpenChange={onOpenRegistrationOpenChange}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Abrir Inscripción</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Abrir la inscripción del torneo? Los equipos podrán
                            registrarse después de esto.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={onOpenRegistration}>
                            Abrir Inscripción
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={startOpen} onOpenChange={onStartOpenChange}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Iniciar Torneo</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que deseas iniciar el torneo? Se
                            generará el bracket y no se podrán agregar más
                            equipos.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={onStart}>
                            Iniciar Torneo
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={cancelOpen} onOpenChange={onCancelOpenChange}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancelar Torneo</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que deseas cancelar el torneo? Esta
                            acción puede afectar a los equipos inscriptos.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Volver</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={onCancel}
                            className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
                        >
                            Cancelar Torneo
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={deleteOpen} onOpenChange={onDeleteOpenChange}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar Torneo</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que deseas eliminar este torneo?
                            Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={onDelete}
                            className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog
                open={withdrawOpen}
                onOpenChange={onWithdrawOpenChange}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Retirar Inscripción</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que deseas retirar la inscripción
                            de tu equipo del torneo?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={onWithdraw}
                            className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
                        >
                            Retirar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
