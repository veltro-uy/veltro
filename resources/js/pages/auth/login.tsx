import { Form, Head } from "@inertiajs/react";
import { useState } from "react";
import InputError from "@/components/input-error";
import TextLink from "@/components/text-link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import AuthLayout from "@/layouts/auth-layout";
import { validateEmail, validatePassword } from "@/lib/validation";
import { register } from "@/routes";
import { store } from "@/routes/login";
import { request } from "@/routes/password";

interface LoginProps {
	status?: string;
	error?: string;
	canResetPassword: boolean;
	canRegister: boolean;
}

export default function Login({
	status,
	error,
	canResetPassword,
	canRegister,
}: LoginProps) {
	const [clientErrors, setClientErrors] = useState<{
		email?: string;
		password?: string;
	}>({});

	const validateField = (field: "email" | "password", value: string) => {
		let error: string | null = null;

		if (field === "email") {
			error = validateEmail(value);
		} else if (field === "password") {
			error = validatePassword(value);
		}

		setClientErrors((prev) => ({
			...prev,
			[field]: error || undefined,
		}));

		return error === null;
	};

	const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		if (clientErrors.email) {
			validateField("email", value);
		}
	};

	const handleEmailBlur = (e: React.FocusEvent<HTMLInputElement>) => {
		validateField("email", e.target.value);
	};

	const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		if (clientErrors.password) {
			validateField("password", value);
		}
	};

	const handlePasswordBlur = (e: React.FocusEvent<HTMLInputElement>) => {
		validateField("password", e.target.value);
	};

	const handleSubmit = (e: React.FormEvent) => {
		const form = e.currentTarget as HTMLFormElement;
		const formData = new FormData(form);
		const email = (formData.get("email") as string) || "";
		const password = (formData.get("password") as string) || "";

		const emailValid = validateField("email", email);
		const passwordValid = validateField("password", password);

		if (!emailValid || !passwordValid) {
			e.preventDefault();
			return false;
		}
	};

	return (
		<AuthLayout
			title="Inicia sesión en tu cuenta"
			description="Ingresa tu correo electrónico y contraseña para iniciar sesión"
		>
			<Head title="Iniciar sesión" />

			<div className="flex flex-col gap-6">
				<Button
					type="button"
					variant="outline"
					className="w-full"
					onClick={() => window.location.assign("/auth/google/redirect")}
				>
					<svg
						className="mr-2 h-4 w-4"
						aria-hidden="true"
						focusable="false"
						data-prefix="fab"
						data-icon="google"
						role="img"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 488 512"
					>
						<path
							fill="currentColor"
							d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
						></path>
					</svg>
					Iniciar sesión con Google
				</Button>

				<div className="relative">
					<div className="absolute inset-0 flex items-center">
						<span className="w-full border-t" />
					</div>
					<div className="relative flex justify-center text-xs uppercase">
						<span className="bg-background px-2 text-muted-foreground">
							O continuar con
						</span>
					</div>
				</div>
			</div>

			<Form
				{...store.form()}
				resetOnSuccess={["password"]}
				onSubmit={handleSubmit}
				className="flex flex-col gap-6"
			>
				{({ processing, errors }) => {
					const emailError = errors.email || clientErrors.email;
					const passwordError = errors.password || clientErrors.password;

					return (
						<>
							<div className="grid gap-6">
								<div className="grid gap-2">
									<Label htmlFor="email">Correo electrónico</Label>
									<Input
										id="email"
										type="email"
										name="email"
										required
										autoFocus
										tabIndex={1}
										autoComplete="email"
										placeholder="correo@ejemplo.com"
										error={Boolean(emailError)}
										onChange={handleEmailChange}
										onBlur={handleEmailBlur}
									/>
									<InputError message={emailError} />
								</div>

								<div className="grid gap-2">
									<div className="flex items-center">
										<Label htmlFor="password">Contraseña</Label>
										{canResetPassword && (
											<TextLink
												href={request()}
												className="ml-auto text-sm"
												tabIndex={5}
											>
												¿Olvidaste tu contraseña?
											</TextLink>
										)}
									</div>
									<Input
										id="password"
										type="password"
										name="password"
										required
										tabIndex={2}
										autoComplete="current-password"
										placeholder="Contraseña"
										error={Boolean(passwordError)}
										onChange={handlePasswordChange}
										onBlur={handlePasswordBlur}
									/>
									<InputError message={passwordError} />
								</div>

								<div className="flex items-center space-x-3">
									<Checkbox id="remember" name="remember" tabIndex={3} />
									<Label htmlFor="remember">Recuérdame</Label>
								</div>

								<Button
									type="submit"
									className="mt-4 w-full"
									tabIndex={4}
									disabled={processing}
									data-test="login-button"
								>
									{processing && <Spinner />}
									Iniciar sesión
								</Button>
							</div>

							{canRegister && (
								<div className="text-center text-sm text-muted-foreground">
									¿No tienes una cuenta?{" "}
									<TextLink href={register()} tabIndex={5}>
										Regístrate
									</TextLink>
								</div>
							)}
						</>
					);
				}}
			</Form>

			{status && (
				<div className="mb-4 text-center text-sm font-medium text-green-600">
					{status}
				</div>
			)}

			{error && (
				<div className="mb-4 text-center text-sm font-medium text-red-600">
					{error}
				</div>
			)}
		</AuthLayout>
	);
}
