import { Form, Head } from "@inertiajs/react";
import { useState } from "react";
import InputError from "@/components/input-error";
import TextLink from "@/components/text-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import AuthLayout from "@/layouts/auth-layout";
import {
	validateEmail,
	validateName,
	validatePassword,
	validatePasswordConfirmation,
} from "@/lib/validation";
import { login } from "@/routes";
import { store } from "@/routes/register";

export default function Register() {
	const [clientErrors, setClientErrors] = useState<{
		name?: string;
		email?: string;
		password?: string;
		password_confirmation?: string;
	}>({});

	const [formData, setFormData] = useState({
		name: "",
		email: "",
		password: "",
		password_confirmation: "",
	});

	const validateField = (
		field: "name" | "email" | "password" | "password_confirmation",
		value: string,
		currentFormData?: typeof formData,
	) => {
		const data = currentFormData || formData;
		let error: string | null = null;

		if (field === "name") {
			error = validateName(value);
		} else if (field === "email") {
			error = validateEmail(value);
		} else if (field === "password") {
			error = validatePassword(value);
			// Also re-validate password confirmation if it has a value
			if (data.password_confirmation && !error) {
				const confirmationError = validatePasswordConfirmation(
					value,
					data.password_confirmation,
				);
				setClientErrors((prev) => ({
					...prev,
					password_confirmation: confirmationError || undefined,
				}));
			}
		} else if (field === "password_confirmation") {
			error = validatePasswordConfirmation(data.password, value);
		}

		setClientErrors((prev) => ({
			...prev,
			[field]: error || undefined,
		}));

		return error === null;
	};

	const handleFieldChange = (
		field: "name" | "email" | "password" | "password_confirmation",
		value: string,
	) => {
		const updatedFormData = { ...formData, [field]: value };
		setFormData(updatedFormData);

		if (clientErrors[field]) {
			validateField(field, value, updatedFormData);
		}

		// If password changes, re-validate password confirmation
		if (field === "password" && updatedFormData.password_confirmation) {
			validateField(
				"password_confirmation",
				updatedFormData.password_confirmation,
				updatedFormData,
			);
		}
	};

	const handleFieldBlur = (
		field: "name" | "email" | "password" | "password_confirmation",
		value: string,
	) => {
		validateField(field, value);
	};

	const handleSubmit = (e: React.FormEvent) => {
		const form = e.currentTarget as HTMLFormElement;
		const formDataObj = new FormData(form);
		const name = (formDataObj.get("name") as string) || "";
		const email = (formDataObj.get("email") as string) || "";
		const password = (formDataObj.get("password") as string) || "";
		const passwordConfirmation =
			(formDataObj.get("password_confirmation") as string) || "";

		const nameValid = validateField("name", name);
		const emailValid = validateField("email", email);
		const passwordValid = validateField("password", password);
		const passwordConfirmationValid = validateField(
			"password_confirmation",
			passwordConfirmation,
		);

		if (
			!nameValid ||
			!emailValid ||
			!passwordValid ||
			!passwordConfirmationValid
		) {
			e.preventDefault();
			return false;
		}
	};

	return (
		<AuthLayout
			title="Crear una cuenta"
			description="Ingresa tus datos para crear tu cuenta"
		>
			<Head title="Registrarse" />

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
					Registrarse con Google
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
				resetOnSuccess={["password", "password_confirmation"]}
				disableWhileProcessing
				onSubmit={handleSubmit}
				className="flex flex-col gap-6"
			>
				{({ processing, errors }) => {
					const nameError = errors.name || clientErrors.name;
					const emailError = errors.email || clientErrors.email;
					const passwordError = errors.password || clientErrors.password;
					const passwordConfirmationError =
						errors.password_confirmation || clientErrors.password_confirmation;

					return (
						<>
							<div className="grid gap-6">
								<div className="grid gap-2">
									<Label htmlFor="name">Nombre</Label>
									<Input
										id="name"
										type="text"
										required
										autoFocus
										tabIndex={1}
										autoComplete="name"
										name="name"
										placeholder="Nombre completo"
										error={Boolean(nameError)}
										onChange={(e) => handleFieldChange("name", e.target.value)}
										onBlur={(e) => handleFieldBlur("name", e.target.value)}
									/>
									<InputError message={nameError} />
								</div>

								<div className="grid gap-2">
									<Label htmlFor="email">Correo electrónico</Label>
									<Input
										id="email"
										type="email"
										required
										tabIndex={2}
										autoComplete="email"
										name="email"
										placeholder="correo@ejemplo.com"
										error={Boolean(emailError)}
										onChange={(e) => handleFieldChange("email", e.target.value)}
										onBlur={(e) => handleFieldBlur("email", e.target.value)}
									/>
									<InputError message={emailError} />
								</div>

								<div className="grid gap-2">
									<Label htmlFor="password">Contraseña</Label>
									<Input
										id="password"
										type="password"
										required
										tabIndex={3}
										autoComplete="new-password"
										name="password"
										placeholder="Contraseña"
										error={Boolean(passwordError)}
										onChange={(e) =>
											handleFieldChange("password", e.target.value)
										}
										onBlur={(e) => handleFieldBlur("password", e.target.value)}
									/>
									<InputError message={passwordError} />
								</div>

								<div className="grid gap-2">
									<Label htmlFor="password_confirmation">
										Confirmar contraseña
									</Label>
									<Input
										id="password_confirmation"
										type="password"
										required
										tabIndex={4}
										autoComplete="new-password"
										name="password_confirmation"
										placeholder="Confirmar contraseña"
										error={Boolean(passwordConfirmationError)}
										onChange={(e) =>
											handleFieldChange("password_confirmation", e.target.value)
										}
										onBlur={(e) =>
											handleFieldBlur("password_confirmation", e.target.value)
										}
									/>
									<InputError message={passwordConfirmationError} />
								</div>

								<Button
									type="submit"
									className="mt-2 w-full"
									tabIndex={5}
									data-test="register-user-button"
								>
									{processing && <Spinner />}
									Crear cuenta
								</Button>
							</div>

							<div className="text-center text-sm text-muted-foreground">
								¿Ya tienes una cuenta?{" "}
								<TextLink href={login()} tabIndex={6}>
									Iniciar sesión
								</TextLink>
							</div>
						</>
					);
				}}
			</Form>
		</AuthLayout>
	);
}
