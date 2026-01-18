import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Check, Copy, Link as LinkIcon, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Props {
    teamId: number;
    teamName: string;
}

export function InviteTeamMemberModal({ teamId, teamName }: Props) {
    const [open, setOpen] = useState(false);
    const [invitationLink, setInvitationLink] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [role, setRole] = useState<string>('player');
    const [processing, setProcessing] = useState(false);

    const handleGenerateLink = async () => {
        setInvitationLink(null);
        setProcessing(true);

        try {
            const response = await fetch(`/teams/${teamId}/invitations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN':
                        document.querySelector<HTMLMetaElement>(
                            'meta[name="csrf-token"]',
                        )?.content || '',
                },
                body: JSON.stringify({
                    team_id: teamId,
                    role: role,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || 'Error al generar la invitación',
                );
            }

            if (data.invitation?.url) {
                const url = data.invitation.url;
                setInvitationLink(url);

                // Automatically copy to clipboard
                navigator.clipboard
                    .writeText(url)
                    .then(() => {
                        toast.success(
                            data.message ||
                                '¡Enlace generado y copiado al portapapeles!',
                        );
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                    })
                    .catch(() => {
                        toast.success(
                            data.message || '¡Enlace de invitación generado!',
                        );
                    });
            }
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Error al generar la invitación';
            toast.error(message);
        } finally {
            setProcessing(false);
        }
    };

    const copyToClipboard = async () => {
        if (invitationLink) {
            try {
                await navigator.clipboard.writeText(invitationLink);
                setCopied(true);
                toast.success('¡Enlace copiado al portapapeles!');
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                toast.error('No se pudo copiar el enlace');
            }
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (!newOpen) {
            // Reset state when closing
            setInvitationLink(null);
            setCopied(false);
            setRole('player');
            setProcessing(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invitar Miembro
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle>Invitar al equipo {teamName}</DialogTitle>
                    <DialogDescription>
                        Genera un enlace de invitación para compartir con
                        jugadores
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Rol en el equipo</Label>
                        <Select
                            value={role}
                            onValueChange={setRole}
                            disabled={processing || !!invitationLink}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="player">Jugador</SelectItem>
                                <SelectItem value="co_captain">
                                    Vice-Capitán
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {!invitationLink ? (
                        <Button
                            onClick={handleGenerateLink}
                            disabled={processing}
                            className="w-full"
                        >
                            {processing
                                ? 'Generando...'
                                : 'Generar Enlace de Invitación'}
                        </Button>
                    ) : (
                        <div className="space-y-3">
                            <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
                                <div className="mb-3 flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                        <LinkIcon className="h-4 w-4 text-primary" />
                                    </div>
                                    <p className="text-sm font-semibold">
                                        Enlace de invitación generado
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Input
                                        value={invitationLink}
                                        readOnly
                                        className="flex-1 bg-background font-mono text-xs"
                                        onClick={(e) =>
                                            e.currentTarget.select()
                                        }
                                    />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={copyToClipboard}
                                        className="shrink-0"
                                    >
                                        {copied ? (
                                            <Check className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                                <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-orange-500"></span>
                                    Este enlace expira en 7 días
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => {
                                        setInvitationLink(null);
                                        setCopied(false);
                                    }}
                                >
                                    Generar Nuevo Enlace
                                </Button>
                                <Button
                                    variant="default"
                                    className="flex-1"
                                    onClick={copyToClipboard}
                                >
                                    <Copy className="mr-2 h-4 w-4" />
                                    {copied ? '¡Copiado!' : 'Copiar Enlace'}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
