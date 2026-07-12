# Matriz de trazabilidad de requerimientos

Este documento vincula cada **requerimiento funcional (RF)** de Veltro con el
**artefacto** que lo implementa (ruta/endpoint o comando), el **caso de prueba**
que lo verifica (catálogo de QA en `/docs`, definido en
`resources/js/data/test-cases.ts`) y la **evidencia documental** (Pull Requests
de GitHub que lo implementaron o modificaron).

- Los IDs de requerimiento (`RF-…`) y de caso de prueba (`AUTH-REG-002`, etc.)
  provienen del catálogo de casos de uso visible en la página `/docs`.
- La columna **Evidencia documental** referencia los PRs de GitHub del
  repositorio `veltro-uy/veltro`.
- Cuando un requerimiento fue provisto por el _starter kit_ de Laravel/Fortify o
  por commits previos al historial de PRs numerados, se indica
  **Base del proyecto**.
- El índice completo de los 79 PRs (incluidos merges de _release_ y trabajos no
  funcionales) está en el [Anexo A](#anexo-a--índice-completo-de-prs).

---

## Autenticación

| ID Req | Descripción del requerimiento | Artefacto que lo implementa | Caso de prueba asociado | Evidencia documental |
| --- | --- | --- | --- | --- |
| RF-AUTH-001 | Registro de usuario con email y contraseña | `POST /register`, `GET /register` | AUTH-REG-002 – Registro exitoso con datos válidos (AUTH-REG-001…012) | PR: 59, 89, 119, 123 |
| RF-AUTH-002 | Validación de email en el registro (formato, requerido, único) | `POST /register` | AUTH-REG-004 – Registro falla sin email (AUTH-REG-004, 007, 009) | PR: 59, 123 |
| RF-AUTH-003 | Validación de contraseña (requerida, fortaleza, confirmación) | `POST /register` | AUTH-REG-005 – Registro falla sin contraseña (AUTH-REG-005, 008) | PR: 59, 123 |
| RF-AUTH-004 | Usuario autenticado no puede acceder a páginas de invitado | Middleware `guest` en `/login`, `/register` | AUTH-LOG-009 – Usuario autenticado no puede acceder a login (AUTH-REG-011, 012) | Base del proyecto |
| RF-AUTH-005 | Manejo de errores del servicio de autenticación | `POST /register`, `GET /auth/google/callback` | AUTH-REG-010 – Registro falla por error de servicio (AUTH-OAUTH-007) | PR: 72 |
| RF-AUTH-006 | Inicio de sesión con email y contraseña | `GET /login`, `POST /login` | AUTH-LOG-002 – Inicio de sesión exitoso (AUTH-LOG-001…006, 011) | PR: 59, 89, 119 |
| RF-AUTH-007 | Desafío de 2FA durante el inicio de sesión | `GET/POST /two-factor-challenge` | AUTH-2FA-005 – Desafío de login con código (AUTH-LOG-007, AUTH-OAUTH-005, AUTH-2FA-005…007) | PR: 2 |
| RF-AUTH-008 | Límite de intentos (rate limiting) en autenticación | Limitadores en `FortifyServiceProvider` (`/login`, `/register`, OAuth) | AUTH-LOG-008 – Bloqueo por límite de intentos (AUTH-OAUTH-008) | PR: 45 |
| RF-AUTH-009 | Cierre de sesión | `POST /logout` | AUTH-LOG-010 – Cerrar sesión (AUTH-VER-006) | Base del proyecto |
| RF-AUTH-010 | Autenticación con Google (OAuth) | `GET /auth/google/redirect`, `GET /auth/google/callback` | AUTH-OAUTH-003 – Registro exitoso con Google (AUTH-OAUTH-001…004, 009) | PR: 2 |
| RF-AUTH-011 | OAuth con invitación de equipo | `GET /auth/google/callback` + `/teams/invite/{token}` | AUTH-OAUTH-006 – Google OAuth con invitación de equipo | PR: 106 |
| RF-AUTH-012 | Recuperación y restablecimiento de contraseña | `GET/POST /forgot-password`, `GET /reset-password/{token}`, `POST /reset-password` | AUTH-PWD-006 – Restablecer contraseña con datos válidos (AUTH-PWD-001…008) | PR: 89 · Base del proyecto |
| RF-AUTH-013 | Verificación de email | `GET /email/verify`, `GET /email/verify/{id}/{hash}`, `POST /email/verification-notification` | AUTH-VER-003 – Verificar con enlace válido (AUTH-VER-001…005, AUTH-OAUTH-010) | PR: 124, 126, 128 |
| RF-AUTH-014 | Gestión de 2FA (activar, QR, códigos de recuperación, desactivar) | `GET /settings/two-factor`, `/user/two-factor-authentication`, `/user/two-factor-recovery-codes` | AUTH-2FA-001 – Activar 2FA requiere confirmar contraseña (AUTH-2FA-001…004, 008, 009) | PR: 2 |

## Equipos

| ID Req | Descripción del requerimiento | Artefacto que lo implementa | Caso de prueba asociado | Evidencia documental |
| --- | --- | --- | --- | --- |
| RF-TEAM-001 | Crear equipo | `GET /teams/create`, `POST /teams` | TEAM-001 – Crear equipo con datos válidos (TEAM-001…003) | PR: 123 · Base del proyecto |
| RF-TEAM-002 | Editar equipo (líder) | `PUT /teams/{id}`, `POST /teams/{teamId}/logo` | TEAM-004 – Editar equipo como líder (TEAM-004, 005) | PR: 66 |
| RF-TEAM-003 | Eliminar equipo (capitán) | `DELETE /teams/{id}` | TEAM-006 – Eliminar equipo como capitán (TEAM-006, 007) | Base del proyecto |
| RF-TEAM-004 | Abandonar el equipo | `POST /teams/{teamId}/leave` | TEAM-008 – Abandonar el equipo (TEAM-008, 009) | Base del proyecto |
| RF-TEAM-005 | Transferir la capitanía | `POST /teams/{teamId}/transfer-captaincy` | TEAM-010 – Transferir la capitanía (TEAM-010, 011) | Base del proyecto |
| RF-TEAM-006 | Cambiar el rol de un miembro | `PUT /teams/{teamId}/members/{userId}/role` | TEAM-012 – Cambiar el rol de un miembro (TEAM-012, 013) | Base del proyecto |
| RF-TEAM-007 | Eliminar a un miembro | `DELETE /teams/{teamId}/members/{userId}` | TEAM-014 – Eliminar a un miembro (TEAM-014, 015) | Base del proyecto |
| RF-TEAM-008 | Descubrir y buscar equipos | `GET /teams`, `GET /teams/search` | TEAM-016 – Descubrir y buscar equipos | PR: 133 · Base del proyecto |
| RF-TEAM-009 | Generar invitación de equipo | `POST /teams/{teamId}/invitations`, `GET /teams/{teamId}/invitations` | INV-001 – Generar invitación como líder (INV-001, 002) | PR: 76, 106 |
| RF-TEAM-010 | Ver y aceptar invitación por enlace | `GET /teams/invite/{token}`, `POST /teams/invite/{token}/accept` | INV-004 – Aceptar invitación válida (INV-003…006) | PR: 61, 62, 106 |
| RF-TEAM-011 | Revocar invitación pendiente | `POST /team-invitations/{id}/revoke` | INV-007 – Revocar invitación pendiente | PR: 76 |
| RF-TEAM-012 | Solicitar unirse a un equipo | `POST /join-requests` | JOIN-001 – Solicitar unirse a un equipo (JOIN-001…004) | Base del proyecto |
| RF-TEAM-013 | Gestionar solicitudes de ingreso | `POST /join-requests/{id}/accept`, `/reject`, `DELETE /join-requests/{id}` | JOIN-005 – Aceptar solicitud de ingreso (JOIN-005…007) | Base del proyecto |

## Partidos

| ID Req | Descripción del requerimiento | Artefacto que lo implementa | Caso de prueba asociado | Evidencia documental |
| --- | --- | --- | --- | --- |
| RF-MATCH-001 | Crear partido | `POST /matches` | MATCH-001 – Crear partido como líder (MATCH-001…003) | PR: 60, 64, 123 |
| RF-MATCH-002 | Editar partido (con guarda de inicio) | `GET /matches/{id}/edit`, `PUT /matches/{id}` | MATCH-004 – Editar partido antes de comenzar (MATCH-004, 005) | PR: 64 |
| RF-MATCH-003 | Cancelar partido | `POST /matches/{id}/cancel` | MATCH-006 – Cancelar partido antes de comenzar | Base del proyecto |
| RF-MATCH-004 | Actualizar marcador | `POST /matches/{id}/score` | MATCH-007 – Actualizar marcador antes del inicio (MATCH-007, 008) | PR: 64 |
| RF-MATCH-005 | Finalizar partido | `POST /matches/{id}/complete` | MATCH-009 – Finalizar partido | Base del proyecto |
| RF-MATCH-006 | Registrar eventos de gol | `POST /match-events`, `DELETE /match-events/{eventId}` | MATCH-010 – Registrar evento de gol | PR: 69, 76 |
| RF-MATCH-007 | Solicitar jugar un partido (emparejamiento) | `POST /match-requests` | MREQ-001 – Solicitar jugar un partido (MREQ-001…003) | Base del proyecto |
| RF-MATCH-008 | Aceptar/rechazar solicitud de partido | `POST /match-requests/{id}/accept`, `/reject` | MREQ-004 – Aceptar solicitud de partido (MREQ-004, 005) | Base del proyecto |
| RF-MATCH-009 | Gestión de disponibilidad de jugadores | `POST /matches/{matchId}/availability` | AVAIL-001 – Confirmar disponibilidad propia (AVAIL-001…003) | PR: 50, 67, 131 |
| RF-MATCH-010 | Recordatorios automáticos de disponibilidad | Comando `availability:send-reminders` (programado) | AVAIL-004 – Recordatorio automático de disponibilidad | PR: 50 |

## Torneos

| ID Req | Descripción del requerimiento | Artefacto que lo implementa | Caso de prueba asociado | Evidencia documental |
| --- | --- | --- | --- | --- |
| RF-TRN-001 | Crear torneo | `GET /tournaments/create`, `POST /tournaments` | TRN-001 – Crear torneo con datos válidos (TRN-001, 002) | PR: 77, 78, 102, 116 |
| RF-TRN-002 | Editar torneo, formato y programación de partidos | `GET /tournaments/{id}/edit`, `PUT /tournaments/{id}`, `PATCH /tournaments/{tournament}/matches/{match}` | TRN-003 – Editar torneo solo por el organizador (TRN-003, 004) | PR: 93, 95 |
| RF-TRN-003 | Abrir inscripciones | `POST /tournaments/{id}/open-registration` | TRN-005 – Abrir inscripciones | PR: 95 |
| RF-TRN-004 | Iniciar torneo (con validación de equipos y sorteo de grupos) | `POST /tournaments/{id}/start`, `POST /tournaments/{id}/groups/draw` | TRN-006 – Iniciar torneo con suficientes equipos (TRN-006, 007) | PR: 79, 95 |
| RF-TRN-005 | Cancelar torneo | `POST /tournaments/{id}/cancel` | TRN-008 – Cancelar torneo | PR: 95 |
| RF-TRN-006 | Visibilidad de posiciones según tipo de torneo | `GET /tournaments/{id}` | TRN-009 – Visibilidad de posiciones (invite_only) | PR: 79, 99 |
| RF-TRN-007 | Inscribir equipo en un torneo | `POST /tournaments/{id}/register` | TREG-001 – Inscribir equipo en torneo público (TREG-001…003) | PR: 95 · Base del proyecto |
| RF-TRN-008 | Aprobar/rechazar inscripción (organizador) | `POST /tournament-registrations/{id}/approve`, `/reject` | TREG-004 – Aprobar/rechazar inscripción | Base del proyecto |
| RF-TRN-009 | Retirar inscripción | `DELETE /tournament-registrations/{id}` | TREG-005 – Retirar inscripción | Base del proyecto |

## Cuenta y social

| ID Req | Descripción del requerimiento | Artefacto que lo implementa | Caso de prueba asociado | Evidencia documental |
| --- | --- | --- | --- | --- |
| RF-ACC-001 | Onboarding de la cuenta | `GET/POST /onboarding`, `POST /onboarding/skip` | ONB-002 – Completar onboarding con teléfono (ONB-001…005) | PR: 69 |
| RF-ACC-002 | Actualizar datos de perfil | `GET /settings/profile`, `PATCH /settings/profile` | SET-001 – Actualizar datos de perfil (SET-001, 002) | PR: 65 |
| RF-ACC-003 | Cambiar contraseña | `GET /settings/password`, `PUT /settings/password` | SET-003 – Cambiar contraseña | PR: 65 · Base del proyecto |
| RF-ACC-004 | Subir y quitar avatar | `POST /settings/avatar`, `DELETE /settings/avatar` | SET-004 – Subir y quitar avatar | PR: 65 |
| RF-ACC-005 | Eliminar la cuenta | `DELETE /settings/profile` | SET-005 – Eliminar la cuenta | Base del proyecto |
| RF-ACC-006 | Cambiar apariencia (tema) | `GET /settings/appearance` | SET-006 – Cambiar apariencia (tema) | PR: 88 |
| RF-ACC-007 | Ver perfil público de un jugador | `GET /jugadores/{user}`, `GET /api/users/{user}` | SOC-001 – Ver perfil público de un jugador | PR: 65, 71 |
| RF-ACC-008 | Comentarios en el perfil | `GET/POST /api/users/{user}/comments`, `DELETE /api/comments/{comment}` | SOC-002 – Comentar en un perfil (SOC-002…004) | PR: 71, 73 |
| RF-ACC-009 | Recomendaciones (commendations) a jugadores | `GET/POST /api/users/{user}/commendations`, `DELETE …/{category}` | SOC-005 – Recomendar a un jugador (SOC-005…007) | PR: 71, 73 |

---

## Anexo A — Índice completo de PRs

Los 79 PRs del repositorio. Los PRs marcados como **Release** son merges de
`dev → main` sin cambios de código propios; los de tipo _chore/refactor/perf/ci/
docs/branding_ son trabajos no funcionales que respaldan a los requerimientos de
forma transversal.

| PR | Fecha (merge) | Autor | Tipo | Título |
| --- | --- | --- | --- | --- |
| #1 | 2026-01-12 | mrnzdev | chore | Update footer text to specify "amateurs" |
| #2 | 2026-01-13 | mrnzdev | feat | Enforce 2FA for Google OAuth login |
| #45 | 2026-01-14 | mrnzdev | feat | Implement comprehensive rate limiting across all routes |
| #50 | 2026-01-16 | mrnzdev | feat | Player availability tracking with automated reminders |
| #59 | 2026-01-17 | mrnzdev | feat | Improve validation UX in sign in and sign up pages |
| #60 | 2026-01-18 | mrnzdev | feat | Remove /dashboard and improve match creation UX with modal |
| #61 | 2026-01-18 | mrnzdev | fix | Team invitation link display issue |
| #62 | 2026-01-18 | mrnzdev | fix | Team invitation link display issue |
| #63 | 2026-01-18 | mrnzdev | Release | Merge dev into main |
| #64 | 2026-01-19 | mrnzdev | feat | Improve match score UI and add date validation |
| #65 | 2026-01-20 | mrnzdev | feat | Comprehensive user profile system with avatar uploads |
| #66 | 2026-01-21 | mrnzdev | feat | Team logo upload with edit modal and Cloudflare R2 support |
| #67 | 2026-01-23 | mrnzdev | feat | Improve match page UI with consolidated availability panel |
| #69 | 2026-01-25 | mrnzdev | feat | Onboarding flow and goal scoring system |
| #70 | 2026-01-26 | mrnzdev | feat | Comprehensive notification system with real-time updates |
| #71 | 2026-01-27 | mrnzdev | feat | User profile commendations and comments system |
| #72 | 2026-01-27 | mrnzdev | fix | Critical security vulnerabilities and performance |
| #73 | 2026-01-28 | mrnzdev | fix | Improve commendation state persistence and UX |
| #76 | 2026-04-07 | mrnzdev | feat | Improve match events and team invitation management |
| #77 | 2026-04-07 | mrnzdev | fix | Cast max_teams to int in TournamentService |
| #78 | 2026-04-07 | mrnzdev | fix | Cast max_teams to int in TournamentService (#77) |
| #79 | 2026-04-08 | mrnzdev | feat | Polish tournament show page and gate start button |
| #80 | 2026-04-08 | mrnzdev | Release | Merge dev into main |
| #81 | 2026-04-08 | mrnzdev | Release | Merge dev into main |
| #82 | 2026-04-09 | mrnzdev | fix | Resolve type errors and replace native confirm dialogs |
| #83 | 2026-04-11 | mrnzdev | refactor | Decompose matches/show.tsx into focused components |
| #84 | 2026-04-11 | mrnzdev | fix | Error toasts, confirmation dialogs, and aria-labels |
| #85 | 2026-04-12 | mrnzdev | Release | Merge dev into main |
| #86 | 2026-04-12 | mrnzdev | fix | Re-land polish sweep (toasts, dialogs, aria-labels) |
| #87 | 2026-04-12 | mrnzdev | chore | Dep security bumps + console cleanup |
| #88 | 2026-04-19 | mrnzdev | feat | Redesign landing page and enforce permanent dark mode |
| #89 | 2026-04-19 | mrnzdev | feat | Redesign auth pages and logo to match landing aesthetic |
| #90 | 2026-04-19 | mrnzdev | Release | Merge dev into main |
| #91 | 2026-04-19 | mrnzdev | fix | Self-host Barlow Condensed to eliminate font flash |
| #92 | 2026-04-19 | mrnzdev | Release | Merge dev into main |
| #93 | 2026-04-25 | mrnzdev | feat | Tournament organizers schedule per-match date and venue |
| #94 | 2026-04-25 | mrnzdev | Release | Merge dev into main |
| #95 | 2026-05-18 | mrnzdev | feat | Per-match scheduling, edit guard, league + group-stage formats |
| #96 | 2026-05-18 | mrnzdev | feat | Improve tournaments index |
| #97 | 2026-05-18 | mrnzdev | chore | Polish docs and tournament flows |
| #98 | 2026-05-18 | mrnzdev | Release | Tournaments overhaul, landing redesign, stability fixes |
| #99 | 2026-05-18 | mrnzdev | feat | Improve tournament detail layout |
| #100 | 2026-05-27 | mrnzdev | docs | Translate readme to spanish |
| #101 | 2026-05-27 | mrnzdev | chore | Polish project defaults |
| #102 | 2026-06-03 | mrnzdev | fix | Resolve 500 on tournament create/update with logo |
| #103 | 2026-06-03 | mrnzdev | Release | dev → main |
| #104 | 2026-06-10 | mrnzdev | feat | Complete notifications + real-time broadcast |
| #105 | 2026-06-10 | mrnzdev | Release | Notifications + real-time broadcast |
| #106 | 2026-06-10 | mrnzdev | feat | Complete team invite link signup flow |
| #107 | 2026-06-10 | mrnzdev | Release | dev → main |
| #108 | 2026-06-10 | mrnzdev | feat | Refresh brand logo (green hexagon) + favicon, OpenGraph & SEO |
| #109 | 2026-06-10 | mrnzdev | Release | dev → main |
| #110 | 2026-06-11 | mrnzdev | fix | Prevent blank page when Reverb key is missing in the build |
| #111 | 2026-06-11 | mrnzdev | Release | dev → main |
| #112 | 2026-06-11 | mrnzdev | fix | Landing header logo — green hexagon, no green background |
| #113 | 2026-06-11 | mrnzdev | Release | dev → main |
| #114 | 2026-06-11 | mrnzdev | fix | Collapsed sidebar shows only the centered Veltro hexagon |
| #115 | 2026-06-11 | mrnzdev | Release | dev → main |
| #116 | 2026-06-16 | mrnzdev | feat | Tournament timezone fix + guided creation wizard |
| #117 | 2026-06-16 | mrnzdev | Release | dev → main |
| #118 | 2026-06-20 | mrnzdev | feat | High-value notifications + panel UX polish |
| #119 | 2026-06-20 | mrnzdev | feat | Landing + auth redesign with unified brand mark |
| #120 | 2026-06-20 | mrnzdev | feat | High-value notifications with real-time panel |
| #121 | 2026-06-21 | mrnzdev | Release | dev → main |
| #122 | 2026-06-21 | mrnzdev | Release | Merge dev into main |
| #123 | 2026-06-24 | mrnzdev | feat | Input validation on names + branded error pages |
| #124 | 2026-06-25 | mrnzdev | feat | Input validation, branded error pages, Spanish emails, managed-queue fix |
| #125 | 2026-06-25 | mrnzdev | Release | dev → main |
| #126 | 2026-06-25 | mrnzdev | feat | Brand transactional emails with Veltro identity |
| #127 | 2026-06-25 | mrnzdev | Release | dev → main (branded emails) |
| #128 | 2026-06-29 | mrnzdev | feat | Brand transactional emails + database schema docs |
| #129 | 2026-06-30 | mrnzdev | fix | Translate remaining English UI & notification copy to Spanish |
| #130 | 2026-06-30 | mrnzdev | Release | dev → main |
| #131 | 2026-06-30 | mrnzdev | refactor | Move availability-update logic into MatchService |
| #132 | 2026-06-30 | mrnzdev | ci | Make the linter workflow actually enforce quality gates |
| #133 | 2026-07-01 | mrnzdev | perf | Defer below-the-fold match/tournament data + loading states |
| #134 | 2026-07-01 | mrnzdev | Release | dev → main |
| #135 | 2026-07-05 | mrnzdev | docs | Add /docs QA test-case catalogue |
| #136 | 2026-07-05 | mrnzdev | Release | Merge dev into main |

## Anexo B — Notas de trazabilidad

- **Notificaciones** (PR: 70, 104, 118, 120): sistema transversal en tiempo real
  (Reverb) que respalda a RF-MATCH-010 y a los flujos de equipos/torneos, pero
  aún no tiene un RF ni casos de prueba dedicados en el catálogo.
- **Branding / rediseño** (PR: 88, 89, 91, 108, 112, 114, 119): cambios visuales
  que afectan a las pantallas de RF-AUTH-* y a la landing; no funcionales.
- **i18n al español** (PR: 100, 129): transversal a toda la UI y notificaciones.
- **Infraestructura y calidad** (PR: 87, 101, 110, 132, 133): dependencias, CI,
  performance y correcciones de build; no funcionales.
- **Base del proyecto**: requerimientos provistos por el _starter kit_
  Laravel + Fortify (login, logout, reset de contraseña, borrado de cuenta) o por
  el CRUD inicial de equipos/partidos/torneos anterior al historial de PRs
  numerados.
