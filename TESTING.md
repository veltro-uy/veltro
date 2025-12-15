# Guía de Pruebas

Referencia breve para la suite de pruebas (Pest + PHPUnit).

## Qué hay aquí

- Framework: Pest (sobre PHPUnit) con `tests/Pest.php` extendiendo `Tests\TestCase` y `RefreshDatabase` para pruebas Feature.
- Config: `phpunit.xml` configura SQLite en memoria, cache/sesión/cola/correo en array, bcrypt rounds = 4, y define suites Feature/Unit.
- Base: `tests/TestCase.php` disponible para helpers compartidos.

## Cómo ejecutar

- Todas las pruebas: `composer test` (o `php artisan test`)
- Suites: `php artisan test --testsuite=Feature` | `--testsuite=Unit`
- Archivo único: `php artisan test tests/Feature/Auth/AuthenticationTest.php`
- Prueba única: `php artisan test --filter="users can authenticate using the login screen"`
- Cobertura: `php artisan test --coverage`

## Estructura

```
tests/
├─ Feature/
│  ├─ Auth/
│  ├─ Settings/
│  └─ ExampleTest.php
├─ Unit/
│  └─ ExampleTest.php
├─ Pest.php
└─ TestCase.php
```

## Qué verifica cada archivo (nivel alto)

- Auth
    - `AuthenticationTest.php`: página de login, login exitoso, contraseña inválida, logout, límite de tasa, redirección 2FA.
    - `RegistrationTest.php`: página de registro + flujo completo de registro.
    - `EmailVerificationTest.php`: aviso de verificación, éxito de URL firmada, hash/id incorrecto, redirecciones ya verificadas.
    - `PasswordConfirmationTest.php`: página de confirmación de contraseña + requisito de autenticación.
    - `PasswordResetTest.php`: solicitud de enlace, envío de correo, formulario/token de restablecimiento, restablecimiento exitoso, token inválido.
    - `TwoFactorChallengeTest.php`: reglas de acceso y renderizado del desafío 2FA.
    - `VerificationNotificationTest.php`: envío/no-envío de correos de verificación según estado.
- Dashboard
    - `DashboardTest.php`: invitados redirigidos, usuarios autenticados permitidos.
- Settings
    - `ProfileUpdateTest.php`: vista/actualización de perfil, preservación de verificación de correo, eliminación de cuenta, usuarios OAuth sin contraseña, prop Inertia `hasPassword`.
    - `PasswordUpdateTest.php`: cambio de contraseña, validación, flujo de primera contraseña OAuth, redirección intencionada, props Inertia.
    - `TwoFactorAuthenticationTest.php`: acceso a configuración 2FA, control de confirmación de contraseña, función deshabilitada prohibida, redirección de configuración de contraseña OAuth, acceso exitoso una vez establecida la contraseña.
- Examples
    - `Feature/ExampleTest.php` y `Unit/ExampleTest.php`: verificaciones simples/placeholders.

## Consideraciones especiales

- Usuarios OAuth: creados con `password => null` y `google_id`; deben establecer una contraseña antes de eliminar/2FA; pueden establecer primera contraseña sin contraseña actual.
- Banderas 2FA: las pruebas se omiten cuando Fortify 2FA está deshabilitado (`Features::canManageTwoFactorAuthentication()`); configuraciones ajustadas por escenario.
- Aserciones Inertia: `assertInertia` verifica nombres/props de componentes (ej., `settings/profile`, `settings/password`, `settings/two-factor`).
- Límite de tasa: incremento manual del limitador de tasa para aseverar respuestas 429 en abuso de login.
- Sesiones: usa `login.id`, `needs_password_setup`, `intended_url`, `auth.password_confirmed_at` para dirigir flujos.

## Escribir pruebas aquí

- Usar factories (`User::factory()`, modificadores como `unverified()`, `withoutTwoFactor()`).
- Preferir Arrange/Act/Assert, nombres descriptivos `test('...')`.
- Simular efectos externos: `Notification::fake()`, `Event::fake()`.
- Mantener pruebas Feature idempotentes; confiar en `RefreshDatabase` en lugar de limpieza manual.
