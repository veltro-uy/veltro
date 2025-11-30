import { Head, Link, usePage } from "@inertiajs/react";
import { ArrowRight, BarChart3, Calendar, Search, Users } from "lucide-react";
import AppLogo from "@/components/app-logo";
import LandingFooter from "@/components/landing-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { dashboard, login, register } from "@/routes";
import type { SharedData } from "@/types";

export default function LandingPage({
	canRegister = true,
}: {
	canRegister?: boolean;
}) {
	const { auth } = usePage<SharedData>().props;

	return (
		<>
			<Head>
				<title>
					Veltro - Plataforma para Equipos de Fútbol Amateur en Uruguay
				</title>
				<meta
					name="description"
					content="Gestiona tu equipo, organiza partidos, rastrea estadísticas y conecta con otros equipos de fútbol amateur en Uruguay. Todo en un solo lugar."
				/>
			</Head>

			<div className="flex min-h-screen flex-col bg-background">
				{/* Navigation Header */}
				<header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
					<div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
						<Link
							href={dashboard().url}
							className="flex items-center gap-2 font-semibold"
						>
							<AppLogo />
						</Link>

						<nav className="flex items-center gap-4">
							{auth?.user ? (
								<Button asChild>
									<Link href={dashboard().url}>
										Ir al Tablero
										<ArrowRight className="ml-2 h-4 w-4" />
									</Link>
								</Button>
							) : (
								<>
									<Button variant="ghost" asChild>
										<Link href={login().url}>Iniciar sesión</Link>
									</Button>
									{canRegister && (
										<Button asChild>
											<Link href={register().url}>Registrarse</Link>
										</Button>
									)}
								</>
							)}
						</nav>
					</div>
				</header>

				{/* Hero Section */}
				<section className="py-16 md:py-24 lg:py-32">
					<div className="container mx-auto flex max-w-[64rem] flex-col items-center gap-8 px-4 text-center">
						<Badge variant="secondary" className="mb-4">
							Para equipos de fútbol amateur en Uruguay
						</Badge>
						<h1 className="text-4xl font-bold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
							Tu equipo de fútbol,
							<br />
							<span className="text-primary">organizado y conectado</span>
						</h1>
						<p className="max-w-[42rem] text-lg text-muted-foreground sm:text-xl">
							Veltro es la plataforma centralizada para gestionar tu equipo,
							organizar partidos, rastrear estadísticas y conectarte con otros
							equipos de fútbol amateur en Uruguay.
						</p>
						<div className="flex flex-col gap-4 sm:flex-row">
							{auth?.user ? (
								<Button size="lg" asChild>
									<Link href={dashboard().url}>
										Ir al Tablero
										<ArrowRight className="ml-2 h-4 w-4" />
									</Link>
								</Button>
							) : (
								<>
									{canRegister && (
										<Button size="lg" asChild>
											<Link href={register().url}>
												Comenzar gratis
												<ArrowRight className="ml-2 h-4 w-4" />
											</Link>
										</Button>
									)}
									<Button size="lg" variant="outline" asChild>
										<Link href={login().url}>Iniciar sesión</Link>
									</Button>
								</>
							)}
						</div>
					</div>
				</section>

				{/* Features Section */}
				<section className="py-16 md:py-24 lg:py-32">
					<div className="container mx-auto flex max-w-[64rem] flex-col items-center gap-12 px-4">
						<div className="flex flex-col items-center gap-4 text-center">
							<h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
								Todo lo que necesitas para tu equipo
							</h2>
							<p className="max-w-[42rem] text-lg text-muted-foreground">
								Una plataforma completa diseñada específicamente para equipos de
								fútbol amateur
							</p>
						</div>

						<div className="w-full grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
							<Card>
								<CardHeader>
									<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
										<Users className="h-6 w-6 text-primary" />
									</div>
									<CardTitle>Gestión Centralizada de Equipos</CardTitle>
									<CardDescription>
										Toda la información de tu equipo, lista de jugadores e
										historial en un solo lugar. Invita jugadores, gestiona roles
										y mantén tu equipo organizado.
									</CardDescription>
								</CardHeader>
							</Card>

							<Card>
								<CardHeader>
									<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
										<Calendar className="h-6 w-6 text-primary" />
									</div>
									<CardTitle>Organización Fácil de Partidos</CardTitle>
									<CardDescription>
										Encuentra y programa partidos con otros equipos fácilmente.
										Publica tu disponibilidad o busca oponentes para jugar. Todo
										en un tablón central.
									</CardDescription>
								</CardHeader>
							</Card>

							<Card>
								<CardHeader>
									<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
										<BarChart3 className="h-6 w-6 text-primary" />
									</div>
									<CardTitle>Registros Históricos y Estadísticas</CardTitle>
									<CardDescription>
										Rastrea el historial de tu equipo, resultados, goles y
										estadísticas a lo largo del tiempo. Ve el rendimiento de tu
										equipo y jugadores.
									</CardDescription>
								</CardHeader>
							</Card>

							<Card>
								<CardHeader>
									<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
										<Search className="h-6 w-6 text-primary" />
									</div>
									<CardTitle>Descubrimiento de Equipos</CardTitle>
									<CardDescription>
										Conecta con otros equipos amateur en tu área. Busca por
										ubicación, variante de fútbol y nivel de habilidad. Únete a
										la comunidad.
									</CardDescription>
								</CardHeader>
							</Card>
						</div>
					</div>
				</section>

				{/* How It Works Section */}
				<section className="py-16 md:py-24 lg:py-32">
					<div className="container mx-auto flex max-w-[64rem] flex-col items-center gap-12 px-4">
						<div className="flex flex-col items-center gap-4 text-center">
							<h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
								Cómo funciona
							</h2>
							<p className="max-w-[42rem] text-lg text-muted-foreground">
								Comienza en minutos y lleva tu equipo al siguiente nivel
							</p>
						</div>

						<div className="w-full grid gap-8 sm:grid-cols-1 md:grid-cols-3">
							<div className="flex flex-col items-center gap-4 text-center">
								<div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
									1
								</div>
								<h3 className="text-xl font-semibold">
									Crea o únete a un equipo
								</h3>
								<p className="text-muted-foreground">
									Crea tu propio equipo o busca equipos existentes en tu área.
									Configura tu perfil y comienza a construir tu comunidad.
								</p>
							</div>

							<div className="flex flex-col items-center gap-4 text-center">
								<div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
									2
								</div>
								<h3 className="text-xl font-semibold">Organiza partidos</h3>
								<p className="text-muted-foreground">
									Publica tu disponibilidad para jugar o busca oponentes en el
									tablón de partidos. Confirma asistencia y gestiona tu
									calendario.
								</p>
							</div>

							<div className="flex flex-col items-center gap-4 text-center">
								<div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
									3
								</div>
								<h3 className="text-xl font-semibold">Rastrea y mejora</h3>
								<p className="text-muted-foreground">
									Registra resultados, estadísticas y historial. Analiza el
									rendimiento de tu equipo y toma decisiones informadas.
								</p>
							</div>
						</div>
					</div>
				</section>

				{/* Call-to-Action Section */}
				<section className="py-16 md:py-24 lg:py-32">
					<div className="container mx-auto flex max-w-[64rem] flex-col items-center gap-8 rounded-xl border bg-muted/50 p-12 px-4 text-center">
						<h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
							¿Listo para comenzar?
						</h2>
						<p className="max-w-[42rem] text-lg text-muted-foreground">
							Únete a la comunidad de equipos de fútbol amateur en Uruguay y
							lleva la gestión de tu equipo al siguiente nivel.
						</p>
						<div className="flex flex-col gap-4 sm:flex-row">
							{auth?.user ? (
								<Button size="lg" asChild>
									<Link href={dashboard().url}>
										Ir al Tablero
										<ArrowRight className="ml-2 h-4 w-4" />
									</Link>
								</Button>
							) : (
								<>
									{canRegister && (
										<Button size="lg" asChild>
											<Link href={register().url}>
												Comenzar gratis
												<ArrowRight className="ml-2 h-4 w-4" />
											</Link>
										</Button>
									)}
									<Button size="lg" variant="outline" asChild>
										<Link href={login().url}>Ya tengo cuenta</Link>
									</Button>
								</>
							)}
						</div>
					</div>
				</section>

				{/* Footer */}
				<LandingFooter canRegister={canRegister} />
			</div>
		</>
	);
}
