# Veltro

Veltro es una plataforma construida con Laravel, React e Inertia para equipos de fútbol amateur en Uruguay. Permite gestionar planteles, encontrar rivales, coordinar partidos, registrar la disponibilidad de los jugadores, cargar resultados, organizar torneos y crear perfiles de jugadores con comentarios y reconocimientos.

## Tecnologías

- **Backend:** Laravel 12, PHP 8.2+, Laravel Fortify, Socialite, Wayfinder
- **Frontend:** React 19, TypeScript, Inertia 2, Tailwind CSS 4, componentes estilo Radix/Shadcn
- **Datos:** MySQL 8 en desarrollo/producción, SQLite en pruebas
- **Herramientas:** Bun, Vite, Pest, Pint, Prettier, ESLint

## Funcionalidades principales

- Autenticación con email y contraseña, Google OAuth, verificación de email y autenticación en dos factores
- Creación y búsqueda de equipos, solicitudes de ingreso, invitaciones, roles de miembros y logos
- Creación de partidos, solicitudes a rivales, alineaciones, seguimiento de disponibilidad y registro de resultados/eventos
- Formatos de torneo: eliminación directa, liga y fase de grupos con eliminatorias
- Perfiles de usuario con estadísticas de partidos/equipos, comentarios, reconocimientos, avatares y páginas públicas
- Notificaciones, recordatorios programados de disponibilidad, limitación de tasa, modo oscuro e interfaz responsive

## Requisitos

- PHP 8.2+
- Composer
- Node.js 20.19+ o 22.12+
- Bun
- MySQL 8.0+

Docker/Sail está disponible mediante `compose.yaml`, aunque también funciona correctamente con PHP, MySQL y Bun instalados localmente.

## Instalación

```bash
composer install
bun install
cp .env.example .env
php artisan key:generate
php artisan migrate
bun run build
```

Configura al menos estos valores en `.env`:

```env
APP_URL=http://localhost

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=veltro
DB_USERNAME=root
DB_PASSWORD=

QUEUE_CONNECTION=database
```

Google OAuth opcional:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost/auth/google/callback
```

## Desarrollo

Inicia el entorno local estándar:

```bash
composer dev
```

Inicia el entorno con SSR de Inertia:

```bash
composer dev:ssr
```

Inicia solo el servidor de Vite para el frontend:

```bash
bun run dev
```

Comandos frecuentes:

```bash
bun run build          # build de producción del frontend
bun run build:ssr      # builds del cliente y SSR
bun run types          # chequeos de TypeScript
bun run format         # formatea resources/ con Prettier
bun run format:check   # verifica resources/ con Prettier
bun run lint           # ESLint con fixes
./vendor/bin/pint      # formato de PHP
php artisan test       # suite de pruebas PHP
```

Después de agregar o modificar rutas de Laravel, regenera la salida de Wayfinder:

```bash
php artisan wayfinder:generate
```

## Estructura del proyecto

```text
app/
  Http/Controllers/      Controladores HTTP livianos
  Http/Middleware/       Middleware de autenticación, onboarding, apariencia y solicitudes
  Http/Requests/         Validación mediante solicitudes de formulario
  Models/                Modelos de Eloquent
  Notifications/         Clases de notificaciones para usuarios
  Policies/              Políticas de autorización
  Services/              Lógica de negocio y servicios de torneos/partidos/equipos

resources/js/
  components/            Componentes React compartidos
  components/ui/         Primitivas reutilizables de UI
  hooks/                 Hooks de React
  layouts/               Layouts de la app, autenticación y configuración
  pages/                 Páginas de Inertia
  routes/                Helpers de rutas generados por Wayfinder
  types/                 Tipos TypeScript compartidos

routes/
  web.php                Inicio, dashboard, perfiles y rutas relacionadas con autenticación
  teams.php              Equipos, miembros, invitaciones y solicitudes de ingreso
  matches.php            Partidos, solicitudes, alineaciones, eventos y disponibilidad
  tournaments.php        Torneos, inscripciones, grupos y calendario
  settings.php           Perfil, contraseña, apariencia y 2FA
  notifications.php      Endpoints de API para notificaciones

tests/
  Feature/               Pruebas HTTP y de flujos completos
  Unit/                  Pruebas aisladas de servicios
```

## Pruebas

Ejecuta toda la suite:

```bash
composer test
```

Ejecuta pruebas específicas:

```bash
php artisan test tests/Feature/TeamTest.php
php artisan test tests/Feature/Tournament
php artisan test tests/Unit/Services/StandingsServiceTest.php
```

Antes de fusionar cambios importantes, ejecuta:

```bash
bun run types
bun run format:check
bun run build
php artisan test
```

Consulta [TESTING.md](TESTING.md) para ver notas adicionales sobre pruebas.

## Operaciones

El scheduler envía recordatorios de disponibilidad para los próximos partidos:

```bash
php artisan schedule:list
php artisan schedule:run
php artisan availability:send-reminders
```

Cron de producción:

```bash
* * * * * cd /path/to/veltro && php artisan schedule:run >> /dev/null 2>&1
```

Documentación operativa adicional:

- [RATE_LIMITING.md](RATE_LIMITING.md)
- [PRODUCTION_STORAGE_SETUP.md](PRODUCTION_STORAGE_SETUP.md)

## Docker / Sail

Inicia los contenedores:

```bash
./vendor/bin/sail up -d
```

Ejecuta comandos mediante Sail:

```bash
./vendor/bin/sail artisan migrate
./vendor/bin/sail composer install
./vendor/bin/sail bun install
```

Cuando uses Sail, configura:

```env
DB_HOST=mysql
DB_PORT=3306
```

## Convenciones

- Mantén los controladores livianos; coloca la lógica de negocio en servicios.
- Prefiere los helpers generados por Wayfinder desde `resources/js/routes` antes que URLs internas escritas a mano.
- Mantén sincronizados los archivos de rutas frontend generados con los cambios de rutas backend.
- Usa Pest para las pruebas PHP, Pint para el formato PHP y Prettier/TypeScript para el trabajo frontend.
- No commitees `.env`, secretos ni artefactos locales de build.
