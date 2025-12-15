# Veltro

> Una plataforma web para equipos de fútbol amateur en Uruguay para gestionar equipos, organizar partidos, registrar estadísticas y conectar con otros equipos.

[![Laravel](https://img.shields.io/badge/Laravel-12.0+-FF2D20?style=flat&logo=laravel&logoColor=white)](https://laravel.com)
[![React](https://img.shields.io/badge/React-19.2+-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PHP](https://img.shields.io/badge/PHP-8.2+-777BB4?style=flat&logo=php&logoColor=white)](https://www.php.net)

## Tabla de Contenidos

- [Acerca de](#acerca-de)
- [Características](#características)
- [Stack Tecnológico](#stack-tecnológico)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Desarrollo](#desarrollo)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Pruebas](#pruebas)
- [Configuración de Docker](#configuración-de-docker)
- [Recursos Adicionales](#recursos-adicionales)

## Acerca de

Veltro es una aplicación web integral diseñada específicamente para equipos de fútbol amateur en Uruguay. Proporciona una plataforma centralizada donde los equipos pueden:

- **Gestionar Equipos**: Crear y administrar plantillas, roles y configuraciones de equipos
- **Organizar Partidos**: Encontrar oponentes, programar partidos y rastrear asistencia
- **Registrar Estadísticas**: Registrar resultados de partidos, ver historial del equipo y analizar rendimiento
- **Conectar**: Descubrir y conectar con otros equipos amateur en tu área

La plataforma soporta múltiples variantes de fútbol incluyendo Fútbol 11, Fútbol 7, Fútbol 5 y Futsal.

Para documentación detallada de características, consulta [project.md](project.md).

## Características

### Gestión de Usuarios

- Autenticación con email y contraseña
- Integración con OAuth de Google
- Soporte para autenticación de dos factores
- Perfiles de usuario con información personalizable
- Verificación de email

### Gestión de Equipos

- Crear y gestionar equipos
- Descubrimiento y búsqueda de equipos
- Sistema de solicitudes de unión con flujo de aprobación
- Acceso basado en roles (Capitán, Sub-capitán, Jugador)
- Gestión de plantilla del equipo
- Estadísticas e historial del equipo

### Organización de Partidos

- Crear partidos con información detallada
- Tablero de partidos para encontrar oponentes
- Invitaciones y solicitudes de partidos
- Sistema de confirmación de partidos
- Seguimiento de asistencia
- Registro de resultados de partidos
- Historial y estadísticas de partidos

### Características Adicionales

- Notificaciones en tiempo real
- Diseño responsivo para móvil y escritorio
- Soporte para modo oscuro
- Soporte para renderizado del lado del servidor (SSR)

## Stack Tecnológico

### Backend

- **Framework**: Laravel 12.0+
- **PHP**: 8.2+
- **Base de Datos**: MySQL 8.0
- **Autenticación**: Laravel Fortify
- **OAuth**: Laravel Socialite (Google)
- **Pruebas**: Pest PHP

### Frontend

- **Framework**: React 19.2+
- **Lenguaje**: TypeScript 5.7+
- **Framework UI**: Inertia.js 2.0+
- **Componentes**: Shadcn UI (primitivos de Radix UI)
- **Estilos**: Tailwind CSS 4.0
- **Herramienta de Build**: Vite 7.0
- **Gestor de Paquetes**: Bun

### Herramientas de Desarrollo

- **Docker**: Laravel Sail
- **Calidad de Código**: ESLint, Prettier, Laravel Pint
- **Verificación de Tipos**: TypeScript
- **Registro**: Laravel Pail

## Requisitos

Antes de comenzar, asegúrate de tener instalado lo siguiente:

- **PHP**: 8.2 o superior
- **Composer**: Última versión
- **Node.js**: 20.19.0+ o 22.12.0+
- **Bun**: Última versión (recomendado) o npm/yarn
- **MySQL**: 8.0 o superior
- **Docker & Docker Compose**: (Opcional, para Laravel Sail)

## Instalación

### 1. Clonar el Repositorio

```bash
git clone <repository-url>
cd veltro-new
```

### 2. Instalar Dependencias de PHP

```bash
composer install
```

### 3. Instalar Dependencias de JavaScript

```bash
bun install
```

O si usas npm:

```bash
npm install
```

### 4. Configuración del Entorno

Copia el archivo de entorno:

```bash
cp .env.example .env
```

Genera la clave de la aplicación:

```bash
php artisan key:generate
```

### 5. Configuración de la Base de Datos

Configura tu conexión a la base de datos en `.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=veltro
DB_USERNAME=tu_usuario
DB_PASSWORD=tu_contraseña
```

Ejecuta las migraciones:

```bash
php artisan migrate
```

### 6. Compilar Assets

```bash
bun run build
```

O con npm:

```bash
npm run build
```

### 7. Configuración Rápida (Alternativa)

Puedes usar el script de configuración que automatiza los pasos anteriores:

```bash
composer setup
```

Este comando realizará:

- Instalar dependencias de Composer
- Crear archivo `.env` si no existe
- Generar clave de aplicación
- Ejecutar migraciones de base de datos
- Instalar dependencias de JavaScript
- Compilar assets

## Configuración

### Variables de Entorno

Variables de entorno clave para configurar en tu archivo `.env`:

#### Aplicación

```env
APP_NAME="Veltro"
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost
```

#### Base de Datos

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=veltro
DB_USERNAME=root
DB_PASSWORD=
```

#### OAuth de Google

```env
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost/auth/google/callback
```

#### Configuración de Correo

```env
MAIL_MAILER=smtp
MAIL_HOST=mailpit
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="hello@example.com"
MAIL_FROM_NAME="${APP_NAME}"
```

#### Configuración de Cola

```env
QUEUE_CONNECTION=database
```

### Configuración de Laravel Fortify

Fortify está configurado en `config/fortify.php`. Características clave habilitadas:

- Registro
- Verificación de email
- Autenticación de dos factores
- Restablecimiento de contraseña

### Configuración de Inertia.js

Inertia.js está configurado en `config/inertia.php`. La aplicación usa:

- React como framework frontend
- Soporte para renderizado del lado del servidor (SSR)
- Wayfinder para generación de rutas

## Desarrollo

### Iniciar el Servidor de Desarrollo

El proyecto incluye un script de desarrollo conveniente que ejecuta todos los servicios necesarios de forma concurrente:

```bash
composer dev
```

Este comando inicia:

- Servidor de desarrollo de Laravel (puerto 8000)
- Worker de cola
- Servidor de desarrollo de Vite (puerto 5173)

### Desarrollo con SSR

Para ejecutar el servidor de desarrollo con renderizado del lado del servidor:

```bash
composer dev:ssr
```

Esto inicia:

- Servidor de desarrollo de Laravel
- Worker de cola
- Laravel Pail (registro)
- Servidor SSR de Inertia

### Comandos Disponibles

#### Scripts de Composer

```bash
# Configuración inicial del proyecto
composer setup

# Iniciar servidor de desarrollo
composer dev

# Iniciar servidor de desarrollo con SSR
composer dev:ssr

# Ejecutar pruebas
composer test
```

#### Scripts de Frontend (Bun/npm)

```bash
# Iniciar servidor de desarrollo de Vite
bun run dev

# Compilar para producción
bun run build

# Compilar con SSR
bun run build:ssr

# Lint del código
bun run lint

# Formatear código
bun run format

# Verificar formato
bun run format:check

# Verificación de tipos
bun run types
```

#### Comandos de Laravel Artisan

```bash
# Ejecutar migraciones
php artisan migrate

# Ejecutar migraciones con seeders
php artisan migrate --seed

# Limpiar caché
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Generar archivos de ayuda para IDE
php artisan ide-helper:generate
```

### Estilo de Código

El proyecto sigue los estándares de codificación PSR-12 para PHP y usa ESLint/Prettier para JavaScript/TypeScript.

#### Estilo de Código PHP

```bash
# Formatear código PHP
./vendor/bin/pint
```

#### Estilo de Código JavaScript/TypeScript

```bash
# Formatear código
bun run format

# Lint del código
bun run lint
```

## Estructura del Proyecto

```
veltro-new/
├── app/                    # Código de la aplicación Laravel
│   ├── Actions/           # Clases de acción (Fortify)
│   ├── Http/              # Capa HTTP
│   │   ├── Controllers/   # Controladores de la aplicación
│   │   ├── Middleware/    # Middleware personalizado
│   │   └── Requests/      # Validación de solicitudes de formulario
│   ├── Models/            # Modelos Eloquent
│   ├── Providers/         # Proveedores de servicios
│   └── Services/          # Servicios de lógica de negocio
├── bootstrap/             # Archivos de bootstrap de la aplicación
├── config/                # Archivos de configuración
├── database/              # Archivos de base de datos
│   ├── factories/         # Factories de modelos
│   ├── migrations/        # Migraciones de base de datos
│   └── seeders/          # Seeders de base de datos
├── public/                # Raíz web pública
├── resources/             # Recursos frontend
│   ├── css/              # Hojas de estilo
│   ├── js/               # Código fuente JavaScript/TypeScript
│   │   ├── actions/      # Utilidades de acción
│   │   ├── components/   # Componentes React
│   │   ├── hooks/        # Hooks personalizados de React
│   │   ├── layouts/      # Componentes de diseño
│   │   ├── lib/          # Bibliotecas de utilidades
│   │   ├── pages/        # Componentes de página Inertia
│   │   ├── routes/       # Definiciones de rutas
│   │   ├── types/        # Definiciones de tipos TypeScript
│   │   └── wayfinder/    # Ayudantes de rutas Wayfinder
│   └── views/            # Plantillas Blade
├── routes/                # Definiciones de rutas
│   ├── web.php           # Rutas web
│   ├── teams.php         # Rutas de equipos
│   ├── matches.php       # Rutas de partidos
│   └── settings.php      # Rutas de configuración
├── storage/               # Directorio de almacenamiento
├── tests/                 # Archivos de prueba
│   ├── Feature/          # Pruebas de características
│   └── Unit/             # Pruebas unitarias
├── vendor/                # Dependencias de Composer
├── node_modules/         # Dependencias de NPM/Bun
├── compose.yaml          # Configuración de Docker Compose
├── composer.json         # Dependencias de PHP
├── package.json          # Dependencias de JavaScript
├── phpunit.xml           # Configuración de PHPUnit
├── tsconfig.json         # Configuración de TypeScript
├── vite.config.ts        # Configuración de Vite
└── project.md            # Documentación detallada del proyecto
```

## Pruebas

El proyecto usa [Pest PHP](https://pestphp.com) para las pruebas.

### Ejecutar Pruebas

```bash
# Ejecutar todas las pruebas
composer test

# O directamente con Pest
php artisan test

# Ejecutar archivo de prueba específico
php artisan test tests/Feature/Auth/LoginTest.php

# Ejecutar con cobertura
php artisan test --coverage
```

### Estructura de Pruebas

- **Pruebas de Características**: Ubicadas en `tests/Feature/` - Prueban características completas y endpoints de API
- **Pruebas Unitarias**: Ubicadas en `tests/Unit/` - Prueban clases y métodos individuales

### Configuración de Pruebas

Las pruebas usan base de datos SQLite en memoria para velocidad. La configuración está en `phpunit.xml`.

## Configuración de Docker

El proyecto incluye configuración de Docker vía Laravel Sail para facilitar la configuración de desarrollo.

### Usando Laravel Sail

#### Iniciar Contenedores

```bash
./vendor/bin/sail up -d
```

#### Ejecutar Comandos

```bash
# Ejecutar comandos de Artisan
./vendor/bin/sail artisan migrate

# Ejecutar comandos de Composer
./vendor/bin/sail composer install

# Ejecutar comandos de NPM/Bun
./vendor/bin/sail bun install

# Acceder a MySQL
./vendor/bin/sail mysql
```

#### Detener Contenedores

```bash
./vendor/bin/sail down
```

### Servicios de Docker

El archivo `compose.yaml` incluye:

- **Aplicación Laravel**: PHP 8.4 con todas las extensiones requeridas
- **MySQL 8.0**: Servidor de base de datos
- **Puertos**:
    - Aplicación: `80` (configurable vía `APP_PORT`)
    - Vite: `5173` (configurable vía `VITE_PORT`)
    - MySQL: `3307` (configurable vía `FORWARD_DB_PORT`)

### Variables de Entorno para Docker

Cuando uses Sail, asegúrate de que tu archivo `.env` tenga:

```env
DB_HOST=mysql
DB_PORT=3306
```

## Recursos Adicionales

### Documentación

- [Documentación de Laravel](https://laravel.com/docs)
- [Documentación de Inertia.js](https://inertiajs.com)
- [Documentación de React](https://react.dev)
- [Documentación de Shadcn UI](https://ui.shadcn.com)
- [Documentación de Tailwind CSS](https://tailwindcss.com)
- [Documentación de Pest PHP](https://pestphp.com)

### Documentación del Proyecto

- [project.md](project.md) - Documentación detallada de requisitos del producto y características

### Obtener Ayuda

Si encuentras algún problema:

1. Consulta [project.md](project.md) para documentación detallada de características
2. Revisa la documentación de Laravel e Inertia.js
3. Verifica los issues existentes en el repositorio
4. Asegúrate de que todos los requisitos estén cumplidos y las dependencias instaladas

## Licencia

Este proyecto es software de código abierto licenciado bajo la [licencia MIT](LICENSE).

---

**Construido con ❤️ para equipos de fútbol amateur en Uruguay**
