import { Form } from "@inertiajs/react";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Check, Copy, ScanLine } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import InputError from "@/components/input-error";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from "@/components/ui/input-otp";
import { useClipboard } from "@/hooks/use-clipboard";
import { OTP_MAX_LENGTH } from "@/hooks/use-two-factor-auth";
import { confirm } from "@/routes/two-factor";
import AlertError from "./alert-error";
import { QRCode } from "./ui/qr-code";
import { Spinner } from "./ui/spinner";

function GridScanIcon() {
	return (
		<div className="mb-3 rounded-full border border-border bg-card p-0.5 shadow-sm">
			<div className="relative overflow-hidden rounded-full border border-border bg-muted p-2.5">
				<div className="absolute inset-0 grid grid-cols-5 opacity-50">
					{Array.from({ length: 5 }, (_, i) => (
						<div
							key={`col-${i + 1}`}
							className="border-r border-border last:border-r-0"
						/>
					))}
				</div>
				<div className="absolute inset-0 grid grid-rows-5 opacity-50">
					{Array.from({ length: 5 }, (_, i) => (
						<div
							key={`row-${i + 1}`}
							className="border-b border-border last:border-b-0"
						/>
					))}
				</div>
				<ScanLine className="relative z-20 size-6 text-foreground" />
			</div>
		</div>
	);
}

function TwoFactorSetupStep({
	qrCodeUrl,
	manualSetupKey,
	buttonText,
	onNextStep,
	errors,
}: {
	qrCodeUrl: string | null;
	manualSetupKey: string | null;
	buttonText: string;
	onNextStep: () => void;
	errors: string[];
}) {
	const [copiedText, copy] = useClipboard();
	const [qrCodeReady, setQrCodeReady] = useState<boolean>(false);
	const qrCodeRef = useRef<HTMLDivElement>(null);
	const IconComponent = copiedText === manualSetupKey ? Check : Copy;

	useEffect(() => {
		if (!qrCodeUrl) {
			// Use setTimeout to avoid synchronous setState in effect
			const timeoutId = setTimeout(() => {
				setQrCodeReady(false);
			}, 0);
			return () => clearTimeout(timeoutId);
		}

		// Reset ready state when URL changes (deferred to avoid synchronous setState)
		let isMounted = true;
		const resetTimeout = setTimeout(() => {
			if (isMounted) {
				setQrCodeReady(false);
			}
		}, 0);

		// Check if QR code has rendered by observing the container
		const checkInterval = setInterval(() => {
			if (qrCodeRef.current?.querySelector("svg")) {
				if (isMounted) {
					setQrCodeReady(true);
				}
				clearInterval(checkInterval);
			}
		}, 50);

		// Cleanup after 2 seconds max
		const timeout = setTimeout(() => {
			clearInterval(checkInterval);
			if (isMounted) {
				setQrCodeReady(true);
			}
		}, 2000);

		return () => {
			isMounted = false;
			clearTimeout(resetTimeout);
			clearInterval(checkInterval);
			clearTimeout(timeout);
		};
	}, [qrCodeUrl]);

	const hasSetupDataErrors = errors.some(
		(error) =>
			error.includes("Failed to fetch") ||
			error.includes("setup key") ||
			error.includes("QR code"),
	);

	return (
		<>
			{errors?.length ? (
				<div className="space-y-3">
					<AlertError errors={errors} />
					{hasSetupDataErrors && (
						<p className="text-sm text-muted-foreground text-center">
							Si continúas teniendo problemas, intenta deshabilitar y volver a
							habilitar la autenticación de dos factores.
						</p>
					)}
				</div>
			) : (
				<>
					<div className="mx-auto flex max-w-md overflow-hidden">
						<div className="mx-auto aspect-square w-64 rounded-lg border border-border bg-background p-4 shadow-sm">
							<div className="relative z-10 flex h-full w-full items-center justify-center">
								{qrCodeUrl ? (
									<>
										<div ref={qrCodeRef} className="size-full">
											<QRCode
												data={qrCodeUrl}
												className="size-full"
												robustness="M"
											/>
										</div>
										{!qrCodeReady && (
											<div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
												<Spinner />
											</div>
										)}
									</>
								) : (
									<Spinner />
								)}
							</div>
						</div>
					</div>

					<div className="flex w-full space-x-5">
						<Button className="w-full" onClick={onNextStep}>
							{buttonText}
						</Button>
					</div>

					<div className="relative flex w-full items-center justify-center">
						<div className="absolute inset-0 top-1/2 h-px w-full bg-border" />
						<span className="relative bg-card px-2 py-1">
							o, ingresa el código manualmente
						</span>
					</div>

					<div className="flex w-full space-x-2">
						<div className="flex w-full items-stretch overflow-hidden rounded-xl border border-border">
							{!manualSetupKey ? (
								<div className="flex h-full w-full items-center justify-center bg-muted p-3">
									<Spinner />
								</div>
							) : (
								<>
									<input
										type="text"
										readOnly
										value={manualSetupKey}
										className="h-full w-full bg-background p-3 text-foreground outline-none"
									/>
									<button
										onClick={() => copy(manualSetupKey)}
										className="border-l border-border px-3 hover:bg-muted"
									>
										<IconComponent className="w-4" />
									</button>
								</>
							)}
						</div>
					</div>
				</>
			)}
		</>
	);
}

function TwoFactorVerificationStep({
	onClose,
	onBack,
}: {
	onClose: () => void;
	onBack: () => void;
}) {
	const [code, setCode] = useState<string>("");
	const pinInputContainerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		setTimeout(() => {
			pinInputContainerRef.current?.querySelector("input")?.focus();
		}, 0);
	}, []);

	return (
		<Form
			{...confirm.form()}
			onSuccess={() => onClose()}
			resetOnError
			resetOnSuccess
		>
			{({
				processing,
				errors,
			}: {
				processing: boolean;
				errors?: { confirmTwoFactorAuthentication?: { code?: string } };
			}) => (
				<>
					<div ref={pinInputContainerRef} className="relative w-full space-y-3">
						<div className="flex w-full flex-col items-center space-y-3 py-2">
							<InputOTP
								id="otp"
								name="code"
								maxLength={OTP_MAX_LENGTH}
								onChange={setCode}
								disabled={processing}
								pattern={REGEXP_ONLY_DIGITS}
							>
								<InputOTPGroup>
									{Array.from({ length: OTP_MAX_LENGTH }, (_, index) => (
										<InputOTPSlot key={index} index={index} />
									))}
								</InputOTPGroup>
							</InputOTP>
							<InputError
								message={errors?.confirmTwoFactorAuthentication?.code}
							/>
						</div>

						<div className="flex w-full space-x-5">
							<Button
								type="button"
								variant="outline"
								className="flex-1"
								onClick={onBack}
								disabled={processing}
							>
								Atrás
							</Button>
							<Button
								type="submit"
								className="flex-1"
								disabled={processing || code.length < OTP_MAX_LENGTH}
							>
								Confirmar
							</Button>
						</div>
					</div>
				</>
			)}
		</Form>
	);
}

interface TwoFactorSetupModalProps {
	isOpen: boolean;
	onClose: () => void;
	requiresConfirmation: boolean;
	twoFactorEnabled: boolean;
	qrCodeUrl: string | null;
	manualSetupKey: string | null;
	clearSetupData: () => void;
	fetchSetupData: () => Promise<void>;
	errors: string[];
}

export default function TwoFactorSetupModal({
	isOpen,
	onClose,
	requiresConfirmation,
	twoFactorEnabled,
	qrCodeUrl,
	manualSetupKey,
	clearSetupData,
	fetchSetupData,
	errors,
}: TwoFactorSetupModalProps) {
	const [showVerificationStep, setShowVerificationStep] =
		useState<boolean>(false);

	const modalConfig = useMemo<{
		title: string;
		description: string;
		buttonText: string;
	}>(() => {
		if (twoFactorEnabled) {
			return {
				title: "Autenticación de Dos Factores Habilitada",
				description:
					"La autenticación de dos factores está ahora habilitada. Escanea el código QR o ingresa la clave de configuración en tu aplicación de autenticación.",
				buttonText: "Cerrar",
			};
		}

		if (showVerificationStep) {
			return {
				title: "Verificar Código de Autenticación",
				description:
					"Ingresa el código de 6 dígitos desde tu aplicación de autenticación",
				buttonText: "Continuar",
			};
		}

		return {
			title: "Habilitar Autenticación de Dos Factores",
			description:
				"Para finalizar la habilitación de la autenticación de dos factores, escanea el código QR o ingresa la clave de configuración en tu aplicación de autenticación",
			buttonText: "Continuar",
		};
	}, [twoFactorEnabled, showVerificationStep]);

	const handleModalNextStep = useCallback(() => {
		if (requiresConfirmation) {
			setShowVerificationStep(true);
			return;
		}

		clearSetupData();
		onClose();
	}, [requiresConfirmation, clearSetupData, onClose]);

	const resetModalState = useCallback(() => {
		setShowVerificationStep(false);

		if (twoFactorEnabled) {
			clearSetupData();
		}
	}, [twoFactorEnabled, clearSetupData]);

	useEffect(() => {
		if (isOpen && !qrCodeUrl) {
			fetchSetupData().catch(() => {
				// Error handling is done in the hook
			});
		}
	}, [isOpen, qrCodeUrl, fetchSetupData]);

	const handleClose = useCallback(() => {
		resetModalState();
		onClose();
	}, [onClose, resetModalState]);

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader className="flex items-center justify-center">
					<GridScanIcon />
					<DialogTitle>{modalConfig.title}</DialogTitle>
					<DialogDescription className="text-center">
						{modalConfig.description}
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col items-center space-y-5">
					{showVerificationStep ? (
						<TwoFactorVerificationStep
							onClose={onClose}
							onBack={() => setShowVerificationStep(false)}
						/>
					) : (
						<TwoFactorSetupStep
							qrCodeUrl={qrCodeUrl}
							manualSetupKey={manualSetupKey}
							buttonText={modalConfig.buttonText}
							onNextStep={handleModalNextStep}
							errors={errors}
						/>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
