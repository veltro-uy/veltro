/**
 * Static catalogue of manual QA test cases shown on the `/docs` page.
 *
 * Each suite maps to an authentication flow (login, register, OAuth, password
 * reset, email verification, 2FA). The `Estado` a tester assigns to a case is
 * NOT stored here — it lives in the browser's localStorage (see
 * `useLocalStorage` and `pages/docs.tsx`).
 *
 * NOTE: the `RF-AUTH-###` requirement ids are illustrative placeholders; they
 * should map 1:1 to a real requirements list once one exists.
 */

export type TestCaseStatus = 'pending' | 'pass' | 'fail';

export interface TestCase {
    /** Unique, human-readable identifier, e.g. "AUTH-REG-001". */
    id: string;
    /** Related requirement id, e.g. "RF-AUTH-001". */
    requirement: string;
    title: string;
    preconditions: string;
    /** Rendered as a bulleted list. */
    testData: string[];
    /** Rendered as a numbered list. */
    steps: string[];
    expectedResult: string;
}

export interface UseCaseSuite {
    key: string;
    label: string;
    /** Top-level grouping shown as the outer tab (e.g. "Autenticación"). */
    category: string;
    /** Short description shown under the tab heading. */
    description: string;
    cases: TestCase[];
}

const loginCases: TestCase[] = [
    {
        id: 'AUTH-LOG-001',
        requirement: 'RF-AUTH-006',
        title: 'Visualizar página de inicio de sesión',
        preconditions: 'Usuario no autenticado',
        testData: ['N/A'],
        steps: ['Ir a /login'],
        expectedResult:
            'La página de inicio de sesión se muestra con el formulario y el botón de Google',
    },
    {
        id: 'AUTH-LOG-002',
        requirement: 'RF-AUTH-006',
        title: 'Inicio de sesión exitoso',
        preconditions: 'Usuario registrado y verificado',
        testData: ['email: "juan@example.com"', 'contraseña: "contraseña123"'],
        steps: [
            'Ir a /login',
            'Ingresar email y contraseña válidos',
            'Hacer clic en "Iniciar sesión"',
        ],
        expectedResult: 'Usuario autenticado y redirigido a /dashboard',
    },
    {
        id: 'AUTH-LOG-003',
        requirement: 'RF-AUTH-006',
        title: 'Inicio de sesión falla con contraseña incorrecta',
        preconditions: 'Usuario registrado',
        testData: ['email: "juan@example.com"', 'contraseña: "incorrecta"'],
        steps: [
            'Ir a /login',
            'Ingresar email válido y contraseña incorrecta',
            'Hacer clic en "Iniciar sesión"',
        ],
        expectedResult:
            'Mensaje de error indicando que las credenciales no coinciden',
    },
    {
        id: 'AUTH-LOG-004',
        requirement: 'RF-AUTH-006',
        title: 'Inicio de sesión falla con email no registrado',
        preconditions: 'Usuario no autenticado',
        testData: [
            'email: "noexiste@example.com"',
            'contraseña: "contraseña123"',
        ],
        steps: [
            'Ir a /login',
            'Ingresar un email que no existe en la BD',
            'Hacer clic en "Iniciar sesión"',
        ],
        expectedResult:
            'Mensaje de error indicando que las credenciales no coinciden',
    },
    {
        id: 'AUTH-LOG-005',
        requirement: 'RF-AUTH-006',
        title: 'Inicio de sesión falla sin email',
        preconditions: 'Usuario no autenticado',
        testData: ['(sin email)', 'contraseña: "contraseña123"'],
        steps: [
            'Ir a /login',
            'Dejar el campo email vacío',
            'Hacer clic en "Iniciar sesión"',
        ],
        expectedResult: 'Mensaje de error indicando que el email es requerido',
    },
    {
        id: 'AUTH-LOG-006',
        requirement: 'RF-AUTH-006',
        title: 'Inicio de sesión falla sin contraseña',
        preconditions: 'Usuario no autenticado',
        testData: ['email: "juan@example.com"', '(sin contraseña)'],
        steps: [
            'Ir a /login',
            'Dejar el campo contraseña vacío',
            'Hacer clic en "Iniciar sesión"',
        ],
        expectedResult:
            'Mensaje de error indicando que la contraseña es requerida',
    },
    {
        id: 'AUTH-LOG-007',
        requirement: 'RF-AUTH-007',
        title: 'Inicio de sesión con 2FA activado',
        preconditions: 'Usuario con doble factor (2FA) activado',
        testData: ['email: "juan@example.com"', 'contraseña: "contraseña123"'],
        steps: [
            'Ir a /login',
            'Ingresar credenciales válidas',
            'Hacer clic en "Iniciar sesión"',
        ],
        expectedResult:
            'Redirigido a la pantalla de desafío 2FA (/two-factor.login) antes de acceder al dashboard',
    },
    {
        id: 'AUTH-LOG-008',
        requirement: 'RF-AUTH-008',
        title: 'Bloqueo por límite de intentos',
        preconditions: 'Usuario no autenticado',
        testData: ['Credenciales inválidas repetidas (6+ intentos)'],
        steps: [
            'Ir a /login',
            'Intentar iniciar sesión con datos inválidos más de 5 veces en un minuto',
        ],
        expectedResult:
            'Mensaje de error por demasiados intentos (rate limit de 5 req/min)',
    },
    {
        id: 'AUTH-LOG-009',
        requirement: 'RF-AUTH-004',
        title: 'Usuario autenticado no puede acceder a login',
        preconditions: 'Usuario autenticado',
        testData: ['N/A'],
        steps: ['Iniciar sesión', 'Intentar navegar a /login'],
        expectedResult: 'Redirigido automáticamente a /dashboard',
    },
    {
        id: 'AUTH-LOG-010',
        requirement: 'RF-AUTH-009',
        title: 'Cerrar sesión',
        preconditions: 'Usuario autenticado',
        testData: ['N/A'],
        steps: ['Iniciar sesión', 'Hacer clic en "Cerrar sesión"'],
        expectedResult:
            'Sesión finalizada y usuario redirigido a la página de inicio',
    },
    {
        id: 'AUTH-LOG-011',
        requirement: 'RF-AUTH-006',
        title: 'Iniciar sesión con "Recuérdame"',
        preconditions: 'Usuario registrado y verificado',
        testData: [
            'email: "juan@example.com"',
            'contraseña: "contraseña123"',
            'Recuérdame: marcado',
        ],
        steps: [
            'Ir a /login',
            'Ingresar credenciales válidas',
            'Marcar la casilla "Recuérdame"',
            'Hacer clic en "Iniciar sesión"',
            'Cerrar y reabrir el navegador',
        ],
        expectedResult:
            'La sesión persiste tras reabrir el navegador (cookie de "remember"); el usuario sigue autenticado',
    },
    {
        id: 'AUTH-LOG-012',
        requirement: 'RF-AUTH-012',
        title: 'Enlace "¿Olvidaste tu contraseña?"',
        preconditions: 'Usuario no autenticado',
        testData: ['N/A'],
        steps: ['Ir a /login', 'Hacer clic en "¿Olvidaste tu contraseña?"'],
        expectedResult:
            'Redirigido a la página de recuperación de contraseña (/forgot-password)',
    },
];

const registerCases: TestCase[] = [
    {
        id: 'AUTH-REG-001',
        requirement: 'RF-AUTH-001',
        title: 'Visualizar página de registro',
        preconditions: 'Usuario no autenticado',
        testData: ['N/A'],
        steps: ['Navegar a la página de registro (/register)'],
        expectedResult:
            'La página de registro se muestra correctamente con el formulario',
    },
    {
        id: 'AUTH-REG-002',
        requirement: 'RF-AUTH-001',
        title: 'Registro exitoso con datos válidos',
        preconditions: 'Usuario no autenticado',
        testData: [
            'nombre: "Juan Pérez"',
            'email: "juan@example.com"',
            'contraseña: "contraseña123"',
            'confirmar_contraseña: "contraseña123"',
        ],
        steps: [
            'Ir a /register',
            'Llenar nombre, email y contraseña',
            'Confirmar contraseña',
            'Hacer clic en "Registrarse"',
        ],
        expectedResult:
            'Usuario creado, autenticado automáticamente, redirigido a /dashboard',
    },
    {
        id: 'AUTH-REG-003',
        requirement: 'RF-AUTH-001',
        title: 'Registro falla sin nombre',
        preconditions: 'Usuario no autenticado',
        testData: [
            '(sin nombre)',
            'email: "test@example.com"',
            'contraseña: "contraseña123"',
            'confirmar_contraseña: "contraseña123"',
        ],
        steps: [
            'Ir a /register',
            'Dejar campo nombre vacío',
            'Llenar email y contraseña',
            'Hacer clic en "Registrarse"',
        ],
        expectedResult: 'Mensaje de error indicando que el nombre es requerido',
    },
    {
        id: 'AUTH-REG-004',
        requirement: 'RF-AUTH-002',
        title: 'Registro falla sin email',
        preconditions: 'Usuario no autenticado',
        testData: [
            'nombre: "Juan Pérez"',
            '(sin email)',
            'contraseña: "contraseña123"',
            'confirmar_contraseña: "contraseña123"',
        ],
        steps: [
            'Ir a /register',
            'Llenar nombre y contraseña',
            'Dejar campo email vacío',
            'Hacer clic en "Registrarse"',
        ],
        expectedResult: 'Mensaje de error indicando que el email es requerido',
    },
    {
        id: 'AUTH-REG-005',
        requirement: 'RF-AUTH-003',
        title: 'Registro falla sin contraseña',
        preconditions: 'Usuario no autenticado',
        testData: [
            'nombre: "Juan Pérez"',
            'email: "test@example.com"',
            '(sin contraseña)',
        ],
        steps: [
            'Ir a /register',
            'Llenar nombre y email',
            'Dejar campos de contraseña vacíos',
            'Hacer clic en "Registrarse"',
        ],
        expectedResult:
            'Mensaje de error indicando que la contraseña es requerida',
    },
    {
        id: 'AUTH-REG-006',
        requirement: 'RF-AUTH-001',
        title: 'Registro falla con contraseñas no coincidentes',
        preconditions: 'Usuario no autenticado',
        testData: [
            'nombre: "Juan Pérez"',
            'email: "test@example.com"',
            'contraseña: "contraseña123"',
            'confirmar_contraseña: "123"',
        ],
        steps: [
            'Ir a /register',
            'Llenar formulario',
            'Ingresar contraseñas diferentes',
            'Hacer clic en "Registrarse"',
        ],
        expectedResult:
            'Mensaje de error indicando que las contraseñas no coinciden',
    },
    {
        id: 'AUTH-REG-007',
        requirement: 'RF-AUTH-002',
        title: 'Registro falla con email inválido',
        preconditions: 'Usuario no autenticado',
        testData: [
            'nombre: "Juan Pérez"',
            'email: "correoInvalido"',
            'contraseña: "contraseña123"',
            'confirmar_contraseña: "contraseña123"',
        ],
        steps: [
            'Ir a /register',
            'Llenar formulario',
            'Ingresar email sin formato válido (ej. "correo")',
            'Hacer clic en "Registrarse"',
        ],
        expectedResult: 'Mensaje de error indicando que el email no es válido',
    },
    {
        id: 'AUTH-REG-008',
        requirement: 'RF-AUTH-003',
        title: 'Registro falla con contraseña débil',
        preconditions: 'Usuario no autenticado',
        testData: [
            'nombre: "Juan Pérez"',
            'email: "test@example.com"',
            'contraseña: "123"',
            'confirmar_contraseña: "123"',
        ],
        steps: [
            'Ir a /register',
            'Llenar formulario',
            'Ingresar contraseña de menos de 8',
            'Hacer clic en "Registrarse"',
        ],
        expectedResult:
            'Mensaje de error indicando que la contraseña debe tener mínimo 8 caracteres',
    },
    {
        id: 'AUTH-REG-009',
        requirement: 'RF-AUTH-002',
        title: 'Registro falla con email duplicado',
        preconditions: 'Email ya existe en BD',
        testData: [
            'nombre: "Juan Pérez"',
            'email: "existente@example.com"',
            'contraseña: "contraseña123"',
            'confirmar_contraseña: "contraseña123"',
        ],
        steps: [
            'Ir a /register',
            'Llenar formulario con email ya registrado',
            'Hacer clic en "Registrarse"',
        ],
        expectedResult:
            'Mensaje de error indicando que el email ya está registrado',
    },
    {
        id: 'AUTH-REG-010',
        requirement: 'RF-AUTH-005',
        title: 'Registro falla por error de servicio',
        preconditions: 'AuthService retorna error',
        testData: [
            'nombre: "Juan Pérez"',
            'email: "test@example.com"',
            'contraseña: "contraseña123"',
            'confirmar_contraseña: "contraseña123"',
        ],
        steps: [
            'Ir a /register',
            'Llenar formulario correctamente',
            'Hacer clic en "Registrarse"',
            'Simular error del sistema',
        ],
        expectedResult:
            'Mensaje de error genérico informando problema en el servidor',
    },
    {
        id: 'AUTH-REG-011',
        requirement: 'RF-AUTH-004',
        title: 'Usuario autenticado no puede acceder a registro',
        preconditions: 'Usuario autenticado',
        testData: ['N/A'],
        steps: ['Iniciar sesión', 'Intentar navegar a /register'],
        expectedResult: 'Redirigido automáticamente a /dashboard',
    },
    {
        id: 'AUTH-REG-012',
        requirement: 'RF-AUTH-004',
        title: 'Usuario autenticado no puede registrar',
        preconditions: 'Usuario autenticado',
        testData: ['Cualquier dato de registro'],
        steps: [
            'Iniciar sesión en la aplicación',
            'Intentar enviar formulario de registro directamente',
        ],
        expectedResult: 'Redirigido automáticamente a /dashboard',
    },
];

const oauthCases: TestCase[] = [
    {
        id: 'AUTH-OAUTH-001',
        requirement: 'RF-AUTH-010',
        title: 'Visualizar botón "Continuar con Google"',
        preconditions: 'Usuario no autenticado',
        testData: ['N/A'],
        steps: ['Ir a /login o /register'],
        expectedResult:
            'El botón "Continuar con Google" se muestra correctamente',
    },
    {
        id: 'AUTH-OAUTH-002',
        requirement: 'RF-AUTH-010',
        title: 'Redirección al proveedor de Google',
        preconditions: 'Usuario no autenticado',
        testData: ['N/A'],
        steps: ['Ir a /login', 'Hacer clic en "Continuar con Google"'],
        expectedResult:
            'Redirigido a la pantalla de consentimiento de Google (/auth/google/redirect)',
    },
    {
        id: 'AUTH-OAUTH-003',
        requirement: 'RF-AUTH-010',
        title: 'Registro exitoso con Google (usuario nuevo)',
        preconditions: 'El email de Google no existe en la BD',
        testData: ['Cuenta de Google válida no registrada'],
        steps: [
            'Hacer clic en "Continuar con Google"',
            'Autorizar el acceso en Google',
        ],
        expectedResult:
            'Usuario creado (email verificado), autenticado y redirigido a /teams',
    },
    {
        id: 'AUTH-OAUTH-004',
        requirement: 'RF-AUTH-010',
        title: 'Inicio de sesión con Google (usuario existente)',
        preconditions: 'El email de Google ya existe en la BD',
        testData: ['Cuenta de Google válida ya registrada'],
        steps: [
            'Hacer clic en "Continuar con Google"',
            'Autorizar el acceso en Google',
        ],
        expectedResult:
            'Credenciales de Google vinculadas, usuario autenticado y redirigido',
    },
    {
        id: 'AUTH-OAUTH-005',
        requirement: 'RF-AUTH-007',
        title: 'Google OAuth con 2FA activado',
        preconditions: 'Usuario existente con doble factor (2FA) confirmado',
        testData: ['Cuenta de Google del usuario con 2FA'],
        steps: [
            'Hacer clic en "Continuar con Google"',
            'Autorizar el acceso en Google',
        ],
        expectedResult:
            'Redirigido al desafío 2FA (/two-factor.login) antes de acceder, aun habiendo iniciado con Google',
    },
    {
        id: 'AUTH-OAUTH-006',
        requirement: 'RF-AUTH-011',
        title: 'Google OAuth con invitación de equipo',
        preconditions: 'Existe una invitación de equipo válida (token)',
        testData: ['URL con parámetro ?invitation=<token>'],
        steps: [
            'Abrir el enlace de invitación',
            'Hacer clic en "Continuar con Google"',
            'Autorizar el acceso en Google',
        ],
        expectedResult:
            'Usuario auto-unido al equipo y redirigido a la página de la invitación',
    },
    {
        id: 'AUTH-OAUTH-007',
        requirement: 'RF-AUTH-005',
        title: 'Google OAuth cancelado o con error',
        preconditions: 'Usuario no autenticado',
        testData: ['El usuario cancela el consentimiento en Google'],
        steps: [
            'Hacer clic en "Continuar con Google"',
            'Cancelar o denegar el acceso en Google',
        ],
        expectedResult:
            'Redirigido a /login con un mensaje de error indicando que no se pudo iniciar sesión con Google',
    },
    {
        id: 'AUTH-OAUTH-008',
        requirement: 'RF-AUTH-008',
        title: 'Bloqueo por límite de intentos de OAuth',
        preconditions: 'Usuario no autenticado',
        testData: ['Más de 10 solicitudes OAuth en un minuto'],
        steps: [
            'Disparar el flujo de Google repetidamente (11+ veces en un minuto)',
        ],
        expectedResult:
            'Mensaje de error por demasiados intentos (rate limit de 10 req/min)',
    },
    {
        id: 'AUTH-OAUTH-009',
        requirement: 'RF-AUTH-010',
        title: 'Vinculación con cuenta de email/contraseña existente',
        preconditions:
            'Existe un usuario con ese email registrado con contraseña, sin google_id',
        testData: [
            'Cuenta de Google cuyo email coincide con un usuario existente',
        ],
        steps: [
            'Ir a /login',
            'Hacer clic en "Continuar con Google"',
            'Autorizar el acceso en Google',
        ],
        expectedResult:
            'La cuenta se localiza por email y se vinculan las credenciales de Google (sin verificar la contraseña); el usuario inicia sesión',
    },
    {
        id: 'AUTH-OAUTH-010',
        requirement: 'RF-AUTH-013',
        title: 'Usuario no verificado que vincula con Google sigue sin verificar',
        preconditions: 'Usuario existente con email sin verificar y contraseña',
        testData: ['Cuenta de Google del usuario no verificado'],
        steps: [
            'Iniciar sesión con Google usando ese email',
            'Intentar acceder a una ruta protegida (ej. /dashboard)',
        ],
        expectedResult:
            'La cuenta se vincula e inicia sesión, pero email_verified_at no se establece; al acceder a rutas protegidas se le redirige a verificar el correo (/email/verify)',
    },
];

const passwordResetCases: TestCase[] = [
    {
        id: 'AUTH-PWD-001',
        requirement: 'RF-AUTH-012',
        title: 'Visualizar página de recuperación',
        preconditions: 'Usuario no autenticado',
        testData: ['N/A'],
        steps: ['Ir a /login', 'Hacer clic en "¿Olvidaste tu contraseña?"'],
        expectedResult:
            'Se muestra la página /forgot-password con el campo de correo electrónico',
    },
    {
        id: 'AUTH-PWD-002',
        requirement: 'RF-AUTH-012',
        title: 'Solicitar enlace con email registrado',
        preconditions: 'Existe un usuario con ese email',
        testData: ['email: "juan@example.com"'],
        steps: [
            'Ir a /forgot-password',
            'Ingresar el email registrado',
            'Hacer clic en "Enviar enlace de recuperación"',
        ],
        expectedResult:
            'Mensaje de confirmación de que se envió el enlace de recuperación al correo',
    },
    {
        id: 'AUTH-PWD-003',
        requirement: 'RF-AUTH-012',
        title: 'Solicitar enlace con email no registrado',
        preconditions: 'El email no existe en la BD',
        testData: ['email: "noexiste@example.com"'],
        steps: [
            'Ir a /forgot-password',
            'Ingresar un email no registrado',
            'Hacer clic en "Enviar enlace de recuperación"',
        ],
        expectedResult:
            'Mensaje de error indicando que no se encontró un usuario con ese correo (comportamiento por defecto de Laravel)',
    },
    {
        id: 'AUTH-PWD-004',
        requirement: 'RF-AUTH-012',
        title: 'Solicitar enlace sin email o inválido',
        preconditions: 'Usuario no autenticado',
        testData: ['(sin email) o email: "correoInvalido"'],
        steps: [
            'Ir a /forgot-password',
            'Dejar el email vacío o con formato inválido',
            'Hacer clic en "Enviar enlace de recuperación"',
        ],
        expectedResult:
            'Mensaje de error de validación indicando que el email es requerido o no es válido',
    },
    {
        id: 'AUTH-PWD-005',
        requirement: 'RF-AUTH-012',
        title: 'Abrir enlace de restablecimiento válido',
        preconditions: 'Se solicitó un enlace de recuperación válido',
        testData: ['URL /reset-password/{token} recibida por correo'],
        steps: ['Abrir el enlace de restablecimiento del correo'],
        expectedResult:
            'Se muestra el formulario de nueva contraseña con el email prellenado',
    },
    {
        id: 'AUTH-PWD-006',
        requirement: 'RF-AUTH-012',
        title: 'Restablecer contraseña con datos válidos',
        preconditions: 'Enlace de restablecimiento válido abierto',
        testData: [
            'contraseña: "nuevaClave123"',
            'confirmar_contraseña: "nuevaClave123"',
        ],
        steps: [
            'Abrir el enlace de restablecimiento',
            'Ingresar la nueva contraseña y confirmarla',
            'Hacer clic en "Restablecer contraseña"',
        ],
        expectedResult:
            'Contraseña actualizada, redirigido a /login; el usuario puede iniciar sesión con la nueva contraseña',
    },
    {
        id: 'AUTH-PWD-007',
        requirement: 'RF-AUTH-012',
        title: 'Restablecer con contraseña débil o no coincidente',
        preconditions: 'Enlace de restablecimiento válido abierto',
        testData: ['contraseña: "123"', 'confirmar_contraseña: "456"'],
        steps: [
            'Abrir el enlace de restablecimiento',
            'Ingresar una contraseña débil o contraseñas que no coinciden',
            'Hacer clic en "Restablecer contraseña"',
        ],
        expectedResult:
            'Mensaje de error de validación (mínimo 8 caracteres o las contraseñas no coinciden)',
    },
    {
        id: 'AUTH-PWD-008',
        requirement: 'RF-AUTH-012',
        title: 'Restablecer con token inválido o expirado',
        preconditions: 'Usuario no autenticado',
        testData: ['URL /reset-password/{token} con token inválido o vencido'],
        steps: [
            'Abrir un enlace de restablecimiento inválido o expirado',
            'Intentar restablecer la contraseña',
        ],
        expectedResult:
            'Mensaje de error indicando que el enlace es inválido o ha expirado',
    },
];

const emailVerificationCases: TestCase[] = [
    {
        id: 'AUTH-VER-001',
        requirement: 'RF-AUTH-013',
        title: 'Usuario no verificado es redirigido a verificación',
        preconditions: 'Usuario autenticado con email sin verificar',
        testData: ['N/A'],
        steps: [
            'Intentar acceder a una ruta protegida (ej. /dashboard o /teams)',
        ],
        expectedResult:
            'Redirigido a la página de aviso de verificación (/email/verify)',
    },
    {
        id: 'AUTH-VER-002',
        requirement: 'RF-AUTH-013',
        title: 'Reenviar correo de verificación',
        preconditions: 'Usuario autenticado sin verificar en /email/verify',
        testData: ['N/A'],
        steps: [
            'Estar en /email/verify',
            'Hacer clic en "Reenviar correo de verificación"',
        ],
        expectedResult:
            'Mensaje "Se ha enviado un nuevo enlace de verificación" y se reenvía el correo',
    },
    {
        id: 'AUTH-VER-003',
        requirement: 'RF-AUTH-013',
        title: 'Verificar con enlace válido',
        preconditions: 'Usuario autenticado sin verificar',
        testData: ['URL /email/verify/{id}/{hash} válida del correo'],
        steps: ['Abrir el enlace de verificación recibido por correo'],
        expectedResult:
            'El correo queda verificado y el usuario es redirigido a la aplicación (dashboard)',
    },
    {
        id: 'AUTH-VER-004',
        requirement: 'RF-AUTH-013',
        title: 'Enlace de verificación inválido o expirado',
        preconditions: 'Usuario autenticado sin verificar',
        testData: ['URL /email/verify/{id}/{hash} con hash inválido o vencido'],
        steps: ['Abrir un enlace de verificación inválido o expirado'],
        expectedResult:
            'Error 403 (enlace inválido); el correo permanece sin verificar',
    },
    {
        id: 'AUTH-VER-005',
        requirement: 'RF-AUTH-013',
        title: 'Usuario ya verificado accede a la verificación',
        preconditions: 'Usuario autenticado y ya verificado',
        testData: ['N/A'],
        steps: ['Navegar a /email/verify'],
        expectedResult: 'Redirigido a la aplicación (dashboard) sin cambios',
    },
    {
        id: 'AUTH-VER-006',
        requirement: 'RF-AUTH-009',
        title: 'Cerrar sesión desde la página de verificación',
        preconditions: 'Usuario autenticado sin verificar en /email/verify',
        testData: ['N/A'],
        steps: ['Estar en /email/verify', 'Hacer clic en "Cerrar sesión"'],
        expectedResult:
            'Sesión finalizada y usuario redirigido a la página de inicio',
    },
];

const twoFactorCases: TestCase[] = [
    {
        id: 'AUTH-2FA-001',
        requirement: 'RF-AUTH-014',
        title: 'Activar 2FA requiere confirmar contraseña',
        preconditions: 'Usuario autenticado sin 2FA',
        testData: ['contraseña: "contraseña123"'],
        steps: [
            'Ir a /settings/two-factor',
            'Hacer clic en activar la autenticación de dos factores',
        ],
        expectedResult:
            'Se solicita confirmar la contraseña antes de continuar (confirmPassword)',
    },
    {
        id: 'AUTH-2FA-002',
        requirement: 'RF-AUTH-014',
        title: 'Mostrar QR y códigos de recuperación',
        preconditions: 'Usuario autenticado, contraseña confirmada',
        testData: ['N/A'],
        steps: [
            'En /settings/two-factor, iniciar la activación',
            'Confirmar la contraseña',
        ],
        expectedResult:
            'Se muestran el código QR y los códigos de recuperación',
    },
    {
        id: 'AUTH-2FA-003',
        requirement: 'RF-AUTH-014',
        title: 'Confirmar activación con código válido',
        preconditions: 'QR mostrado, app autenticadora configurada',
        testData: ['código: código válido de la app autenticadora'],
        steps: [
            'Escanear el QR en la app autenticadora',
            'Ingresar el código generado',
            'Confirmar la activación',
        ],
        expectedResult:
            'La 2FA queda confirmada y activada para la cuenta (confirm)',
    },
    {
        id: 'AUTH-2FA-004',
        requirement: 'RF-AUTH-014',
        title: 'Confirmar activación con código inválido',
        preconditions: 'QR mostrado',
        testData: ['código: "000000" (inválido)'],
        steps: ['Ingresar un código incorrecto', 'Confirmar la activación'],
        expectedResult: 'Mensaje de error; la 2FA no se activa',
    },
    {
        id: 'AUTH-2FA-005',
        requirement: 'RF-AUTH-007',
        title: 'Desafío de login con código de autenticación',
        preconditions: 'Usuario con 2FA activada',
        testData: ['código: código válido de la app autenticadora'],
        steps: [
            'Iniciar sesión con email y contraseña',
            'En /two-factor-challenge ingresar el código de autenticación',
        ],
        expectedResult:
            'Acceso concedido y redirigido a la aplicación (dashboard)',
    },
    {
        id: 'AUTH-2FA-006',
        requirement: 'RF-AUTH-007',
        title: 'Desafío de login con código inválido',
        preconditions: 'Usuario con 2FA activada',
        testData: ['código: "000000" (inválido)'],
        steps: [
            'Iniciar sesión con email y contraseña',
            'Ingresar un código de autenticación incorrecto',
        ],
        expectedResult:
            'Mensaje de error; permanece en la pantalla de desafío 2FA',
    },
    {
        id: 'AUTH-2FA-007',
        requirement: 'RF-AUTH-007',
        title: 'Desafío usando un código de recuperación',
        preconditions: 'Usuario con 2FA activada y códigos de recuperación',
        testData: ['código de recuperación válido'],
        steps: [
            'Iniciar sesión con email y contraseña',
            'En el desafío, alternar a "código de recuperación"',
            'Ingresar un código de recuperación válido',
        ],
        expectedResult:
            'Acceso concedido; el código de recuperación queda consumido',
    },
    {
        id: 'AUTH-2FA-008',
        requirement: 'RF-AUTH-014',
        title: 'Regenerar códigos de recuperación',
        preconditions: 'Usuario con 2FA activada',
        testData: ['N/A'],
        steps: [
            'Ir a /settings/two-factor',
            'Regenerar los códigos de recuperación',
        ],
        expectedResult:
            'Se generan nuevos códigos; los anteriores dejan de ser válidos',
    },
    {
        id: 'AUTH-2FA-009',
        requirement: 'RF-AUTH-014',
        title: 'Desactivar 2FA',
        preconditions: 'Usuario con 2FA activada',
        testData: ['N/A'],
        steps: [
            'Ir a /settings/two-factor',
            'Desactivar la autenticación de dos factores',
        ],
        expectedResult:
            'La 2FA queda desactivada; el próximo inicio de sesión no solicita desafío',
    },
];

const teamCases: TestCase[] = [
    {
        id: 'TEAM-001',
        requirement: 'RF-TEAM-001',
        title: 'Crear equipo con datos válidos',
        preconditions: 'Usuario autenticado con onboarding completado',
        testData: [
            'nombre: "Los Halcones"',
            'variante: "Fútbol 11"',
            'descripción: (opcional)',
        ],
        steps: [
            'Ir a /teams/create',
            'Ingresar nombre y seleccionar la variante',
            'Hacer clic en "Crear equipo"',
        ],
        expectedResult:
            'Equipo creado; el usuario queda como capitán; mensaje de éxito',
    },
    {
        id: 'TEAM-002',
        requirement: 'RF-TEAM-001',
        title: 'Crear equipo sin nombre',
        preconditions: 'Usuario autenticado',
        testData: ['(sin nombre)', 'variante: "Fútbol 7"'],
        steps: [
            'Ir a /teams/create',
            'Dejar el nombre vacío',
            'Hacer clic en "Crear equipo"',
        ],
        expectedResult: 'Mensaje de error indicando que el nombre es requerido',
    },
    {
        id: 'TEAM-003',
        requirement: 'RF-TEAM-001',
        title: 'Nombre de equipo duplicado permitido',
        preconditions: 'Ya existe un equipo con ese nombre',
        testData: ['nombre: "Los Halcones" (ya existente)'],
        steps: [
            'Ir a /teams/create',
            'Ingresar un nombre que ya usa otro equipo',
            'Hacer clic en "Crear equipo"',
        ],
        expectedResult:
            'El equipo se crea igual (los nombres no son únicos en el sistema)',
    },
    {
        id: 'TEAM-004',
        requirement: 'RF-TEAM-002',
        title: 'Editar equipo como líder',
        preconditions: 'Usuario es capitán o co-capitán del equipo',
        testData: ['nombre y/o descripción nuevos'],
        steps: [
            'Ir a la página del equipo (/teams/{id})',
            'Editar los datos del equipo',
            'Guardar los cambios',
        ],
        expectedResult: 'Equipo actualizado; mensaje de éxito',
    },
    {
        id: 'TEAM-005',
        requirement: 'RF-TEAM-002',
        title: 'Editar equipo sin ser líder',
        preconditions: 'Usuario es jugador (no líder) del equipo',
        testData: ['N/A'],
        steps: ['Intentar enviar la edición del equipo (PUT /teams/{id})'],
        expectedResult: 'Acceso denegado (403 No autorizado)',
    },
    {
        id: 'TEAM-006',
        requirement: 'RF-TEAM-003',
        title: 'Eliminar equipo como capitán',
        preconditions: 'Usuario es el capitán del equipo',
        testData: ['N/A'],
        steps: ['Ir a la página del equipo', 'Eliminar el equipo y confirmar'],
        expectedResult: 'Equipo eliminado; redirigido a /teams con mensaje',
    },
    {
        id: 'TEAM-007',
        requirement: 'RF-TEAM-003',
        title: 'Eliminar equipo sin ser capitán',
        preconditions: 'Usuario es co-capitán (líder pero no capitán)',
        testData: ['N/A'],
        steps: ['Intentar eliminar el equipo (DELETE /teams/{id})'],
        expectedResult:
            'Acceso denegado (403: solo el capitán puede eliminar el equipo)',
    },
    {
        id: 'TEAM-008',
        requirement: 'RF-TEAM-004',
        title: 'Abandonar el equipo (miembro)',
        preconditions: 'Usuario es miembro no capitán del equipo',
        testData: ['N/A'],
        steps: [
            'Ir a la página del equipo',
            'Hacer clic en "Abandonar equipo"',
        ],
        expectedResult: 'El usuario deja de ser miembro; mensaje de éxito',
    },
    {
        id: 'TEAM-009',
        requirement: 'RF-TEAM-004',
        title: 'El capitán no puede abandonar sin transferir',
        preconditions: 'Usuario es el capitán del equipo',
        testData: ['N/A'],
        steps: ['Intentar abandonar el equipo siendo capitán'],
        expectedResult:
            'Mensaje de error: debe transferir la capitanía antes de abandonar',
    },
    {
        id: 'TEAM-010',
        requirement: 'RF-TEAM-005',
        title: 'Transferir la capitanía',
        preconditions: 'Usuario es capitán; el destinatario es miembro',
        testData: ['nuevo_capitán: miembro del equipo'],
        steps: [
            'Ir a la gestión del equipo',
            'Seleccionar un miembro y transferirle la capitanía',
        ],
        expectedResult:
            'El miembro pasa a ser capitán; el capitán anterior queda como jugador',
    },
    {
        id: 'TEAM-011',
        requirement: 'RF-TEAM-005',
        title: 'Transferir capitanía a un no miembro',
        preconditions: 'Usuario es capitán',
        testData: ['nuevo_capitán: usuario que no es miembro'],
        steps: ['Intentar transferir la capitanía a un usuario no miembro'],
        expectedResult:
            'Mensaje de error: el nuevo capitán debe ser miembro del equipo',
    },
    {
        id: 'TEAM-012',
        requirement: 'RF-TEAM-006',
        title: 'Cambiar el rol de un miembro (capitán)',
        preconditions: 'Usuario es capitán del equipo',
        testData: ['rol: "co_captain" o "player"'],
        steps: ['Ir a la gestión de miembros', 'Cambiar el rol de un miembro'],
        expectedResult: 'Rol actualizado; mensaje de éxito',
    },
    {
        id: 'TEAM-013',
        requirement: 'RF-TEAM-006',
        title: 'Cambiar rol sin ser capitán',
        preconditions: 'Usuario es co-capitán',
        testData: ['N/A'],
        steps: ['Intentar cambiar el rol de un miembro'],
        expectedResult:
            'Acceso denegado (403: solo el capitán puede actualizar roles)',
    },
    {
        id: 'TEAM-014',
        requirement: 'RF-TEAM-007',
        title: 'Eliminar a un miembro (líder)',
        preconditions: 'Usuario es líder; el objetivo no es el capitán',
        testData: ['N/A'],
        steps: [
            'Ir a la gestión de miembros',
            'Eliminar a un miembro que no sea el capitán',
        ],
        expectedResult: 'Miembro eliminado del equipo; mensaje de éxito',
    },
    {
        id: 'TEAM-015',
        requirement: 'RF-TEAM-007',
        title: 'No se puede eliminar al capitán',
        preconditions: 'Usuario es líder del equipo',
        testData: ['N/A'],
        steps: ['Intentar eliminar al capitán del equipo'],
        expectedResult:
            'Mensaje de error: no se puede eliminar al capitán (transferir primero)',
    },
    {
        id: 'TEAM-016',
        requirement: 'RF-TEAM-008',
        title: 'Descubrir y buscar equipos',
        preconditions: 'Usuario autenticado',
        testData: ['búsqueda por nombre y/o variante'],
        steps: ['Ir a /teams', 'Usar el buscador y el filtro de variante'],
        expectedResult:
            'Se listan los equipos que coinciden y a los que el usuario no pertenece',
    },
];

const invitationCases: TestCase[] = [
    {
        id: 'INV-001',
        requirement: 'RF-TEAM-009',
        title: 'Generar invitación como líder',
        preconditions: 'Usuario es capitán o co-capitán del equipo',
        testData: ['rol: "player"', 'email: (opcional)'],
        steps: [
            'Ir a la gestión del equipo',
            'Generar una invitación (por email o enlace)',
        ],
        expectedResult:
            'Se crea la invitación con token y vencimiento a 7 días; se obtiene el enlace',
    },
    {
        id: 'INV-002',
        requirement: 'RF-TEAM-009',
        title: 'Generar invitación sin ser líder',
        preconditions: 'Usuario es jugador del equipo',
        testData: ['N/A'],
        steps: ['Intentar crear una invitación (POST /teams/{id}/invitations)'],
        expectedResult:
            'Acceso denegado (403: solo los líderes pueden invitar miembros)',
    },
    {
        id: 'INV-003',
        requirement: 'RF-TEAM-010',
        title: 'Ver invitación como invitado (no autenticado)',
        preconditions: 'Invitación pendiente válida; usuario no autenticado',
        testData: ['URL /teams/invite/{token}'],
        steps: ['Abrir el enlace de invitación sin iniciar sesión'],
        expectedResult:
            'Se muestra la pantalla de invitación para invitados (registro/login)',
    },
    {
        id: 'INV-004',
        requirement: 'RF-TEAM-010',
        title: 'Aceptar invitación válida',
        preconditions: 'Usuario autenticado; invitación pendiente y vigente',
        testData: ['URL /teams/invite/{token}'],
        steps: [
            'Abrir el enlace de invitación autenticado',
            'Hacer clic en "Aceptar invitación"',
        ],
        expectedResult:
            'El usuario se une al equipo con el rol de la invitación; marcada como aceptada',
    },
    {
        id: 'INV-005',
        requirement: 'RF-TEAM-010',
        title: 'Aceptar invitación con equipo lleno',
        preconditions: 'El equipo alcanzó su capacidad máxima',
        testData: ['URL /teams/invite/{token} válida'],
        steps: ['Intentar aceptar la invitación'],
        expectedResult:
            'Mensaje de error indicando que el equipo está lleno; no se une',
    },
    {
        id: 'INV-006',
        requirement: 'RF-TEAM-010',
        title: 'Abrir invitación expirada',
        preconditions: 'La invitación superó los 7 días de vigencia',
        testData: ['URL /teams/invite/{token} expirada'],
        steps: ['Abrir el enlace de invitación'],
        expectedResult:
            'Se muestra la pantalla de invitación expirada; no se puede aceptar',
    },
    {
        id: 'INV-007',
        requirement: 'RF-TEAM-011',
        title: 'Revocar invitación pendiente',
        preconditions: 'Usuario es líder; la invitación está pendiente',
        testData: ['N/A'],
        steps: [
            'Ir a la lista de invitaciones del equipo',
            'Revocar una invitación pendiente',
        ],
        expectedResult:
            'La invitación queda revocada y su enlace deja de ser válido',
    },
];

const joinRequestCases: TestCase[] = [
    {
        id: 'JOIN-001',
        requirement: 'RF-TEAM-012',
        title: 'Solicitar unirse a un equipo',
        preconditions: 'Usuario no es miembro y no tiene solicitud pendiente',
        testData: ['team_id', 'mensaje: (opcional)'],
        steps: [
            'Ir a la página del equipo',
            'Hacer clic en "Solicitar unirse"',
        ],
        expectedResult:
            'Se crea la solicitud en estado pendiente; se notifica a los líderes',
    },
    {
        id: 'JOIN-002',
        requirement: 'RF-TEAM-012',
        title: 'Solicitar unirse siendo ya miembro',
        preconditions: 'Usuario ya es miembro del equipo',
        testData: ['team_id'],
        steps: ['Intentar solicitar unirse al equipo'],
        expectedResult:
            'Mensaje de error indicando que ya es miembro del equipo',
    },
    {
        id: 'JOIN-003',
        requirement: 'RF-TEAM-012',
        title: 'Solicitud duplicada',
        preconditions: 'Ya existe una solicitud pendiente del usuario',
        testData: ['team_id'],
        steps: ['Intentar crear una segunda solicitud para el mismo equipo'],
        expectedResult:
            'Mensaje de error indicando que ya tiene una solicitud pendiente',
    },
    {
        id: 'JOIN-004',
        requirement: 'RF-TEAM-012',
        title: 'Solicitar unirse a equipo lleno',
        preconditions: 'El equipo alcanzó su capacidad máxima',
        testData: ['team_id'],
        steps: ['Intentar solicitar unirse'],
        expectedResult: 'Mensaje de error indicando que el equipo está lleno',
    },
    {
        id: 'JOIN-005',
        requirement: 'RF-TEAM-013',
        title: 'Aceptar solicitud de ingreso (líder)',
        preconditions: 'Usuario es líder; la solicitud está pendiente',
        testData: ['N/A'],
        steps: [
            'Ir a la gestión del equipo',
            'Aceptar una solicitud de ingreso pendiente',
        ],
        expectedResult: 'El solicitante se agrega como jugador; se le notifica',
    },
    {
        id: 'JOIN-006',
        requirement: 'RF-TEAM-013',
        title: 'Rechazar solicitud de ingreso (líder)',
        preconditions: 'Usuario es líder; la solicitud está pendiente',
        testData: ['N/A'],
        steps: ['Rechazar una solicitud de ingreso pendiente'],
        expectedResult:
            'La solicitud queda rechazada; se notifica al solicitante',
    },
    {
        id: 'JOIN-007',
        requirement: 'RF-TEAM-013',
        title: 'Cancelar la propia solicitud',
        preconditions: 'El usuario tiene una solicitud pendiente propia',
        testData: ['N/A'],
        steps: ['Cancelar la solicitud de ingreso propia'],
        expectedResult:
            'La solicitud se elimina; solo el solicitante puede cancelarla',
    },
];

const matchCases: TestCase[] = [
    {
        id: 'MATCH-001',
        requirement: 'RF-MATCH-001',
        title: 'Crear partido como líder',
        preconditions: 'Usuario es líder de un equipo',
        testData: [
            'equipo local',
            'fecha/hora futura',
            'ubicación',
            'tipo: amistoso/competitivo',
        ],
        steps: [
            'Ir a /matches',
            'Abrir "Crear partido"',
            'Completar los datos con fecha futura',
            'Guardar',
        ],
        expectedResult:
            'Partido creado en estado "disponible"; se generan disponibilidades pendientes',
    },
    {
        id: 'MATCH-002',
        requirement: 'RF-MATCH-001',
        title: 'Crear partido con fecha pasada',
        preconditions: 'Usuario es líder de un equipo',
        testData: ['fecha/hora en el pasado'],
        steps: [
            'Abrir "Crear partido"',
            'Ingresar una fecha anterior a ahora',
            'Guardar',
        ],
        expectedResult:
            'Mensaje de error de validación (la fecha debe ser futura)',
    },
    {
        id: 'MATCH-003',
        requirement: 'RF-MATCH-001',
        title: 'Crear partido sin ser líder',
        preconditions: 'Usuario es jugador (no líder)',
        testData: ['N/A'],
        steps: ['Intentar crear un partido para el equipo'],
        expectedResult:
            'Error: solo los líderes del equipo pueden crear partidos',
    },
    {
        id: 'MATCH-004',
        requirement: 'RF-MATCH-002',
        title: 'Editar partido antes de comenzar',
        preconditions: 'Usuario es líder del equipo local; partido no iniciado',
        testData: ['nuevos datos del partido'],
        steps: ['Ir a /matches/{id}/edit', 'Modificar los datos', 'Guardar'],
        expectedResult: 'Partido actualizado correctamente',
    },
    {
        id: 'MATCH-005',
        requirement: 'RF-MATCH-002',
        title: 'Editar partido ya comenzado',
        preconditions: 'El partido ya inició (started_at establecido)',
        testData: ['N/A'],
        steps: ['Intentar editar un partido que ya comenzó'],
        expectedResult:
            'Redirigido con error: no se puede editar un partido que ya comenzó',
    },
    {
        id: 'MATCH-006',
        requirement: 'RF-MATCH-003',
        title: 'Cancelar partido antes de comenzar',
        preconditions: 'Usuario es líder local; partido no iniciado',
        testData: ['N/A'],
        steps: ['Cancelar el partido'],
        expectedResult:
            'Partido en estado "cancelado"; se eliminan solicitudes pendientes y se notifica al rival',
    },
    {
        id: 'MATCH-007',
        requirement: 'RF-MATCH-004',
        title: 'Actualizar marcador antes del inicio',
        preconditions: 'El partido está programado a futuro',
        testData: ['home_score, away_score'],
        steps: ['Intentar actualizar el marcador antes de la hora del partido'],
        expectedResult:
            'Error: no se puede actualizar el marcador antes de que comience',
    },
    {
        id: 'MATCH-008',
        requirement: 'RF-MATCH-004',
        title: 'Actualizar marcador tras el inicio',
        preconditions: 'Partido confirmado y en horario de juego',
        testData: ['home_score: 2', 'away_score: 1'],
        steps: ['Actualizar el marcador siendo líder de alguno de los equipos'],
        expectedResult:
            'Marcador actualizado; el partido pasa a "en progreso"; se notifica al rival',
    },
    {
        id: 'MATCH-009',
        requirement: 'RF-MATCH-005',
        title: 'Finalizar partido',
        preconditions: 'Partido en progreso',
        testData: ['N/A'],
        steps: ['Finalizar el partido (líder de alguno de los equipos)'],
        expectedResult:
            'Partido "completado" (los partidos de eliminación no pueden terminar en empate)',
    },
    {
        id: 'MATCH-010',
        requirement: 'RF-MATCH-006',
        title: 'Registrar evento de gol',
        preconditions:
            'Partido confirmado/en progreso; usuario líder del equipo',
        testData: ['tipo: gol', 'jugador', 'minuto'],
        steps: ['Registrar un evento de gol para el equipo'],
        expectedResult:
            'Evento registrado; el marcador del equipo se incrementa automáticamente',
    },
];

const matchRequestCases: TestCase[] = [
    {
        id: 'MREQ-001',
        requirement: 'RF-MATCH-007',
        title: 'Solicitar jugar un partido',
        preconditions:
            'Usuario es líder de un equipo de la misma variante; partido disponible',
        testData: ['match_id', 'team_id', 'mensaje: (opcional)'],
        steps: [
            'Abrir un partido disponible',
            'Solicitar jugar con un equipo propio',
        ],
        expectedResult:
            'Solicitud creada en estado pendiente; se notifica al equipo local',
    },
    {
        id: 'MREQ-002',
        requirement: 'RF-MATCH-007',
        title: 'Solicitar con variante distinta',
        preconditions: 'El equipo del solicitante tiene otra variante',
        testData: ['equipo de variante distinta a la del partido'],
        steps: ['Intentar solicitar jugar con un equipo de otra variante'],
        expectedResult:
            'Error: la variante del equipo debe coincidir con la del partido',
    },
    {
        id: 'MREQ-003',
        requirement: 'RF-MATCH-007',
        title: 'Solicitud de partido duplicada',
        preconditions:
            'El equipo ya tiene una solicitud pendiente en ese partido',
        testData: ['match_id, team_id repetidos'],
        steps: ['Intentar enviar una segunda solicitud con el mismo equipo'],
        expectedResult:
            'Error: ya existe una solicitud pendiente para ese partido',
    },
    {
        id: 'MREQ-004',
        requirement: 'RF-MATCH-008',
        title: 'Aceptar solicitud de partido',
        preconditions: 'Usuario es líder del equipo local; partido disponible',
        testData: ['N/A'],
        steps: ['Aceptar una solicitud de partido pendiente'],
        expectedResult:
            'El equipo rival queda asignado; partido "confirmado"; el resto de solicitudes se rechazan automáticamente',
    },
    {
        id: 'MREQ-005',
        requirement: 'RF-MATCH-008',
        title: 'Rechazar solicitud de partido',
        preconditions: 'Usuario es líder del equipo local',
        testData: ['N/A'],
        steps: ['Rechazar una solicitud de partido pendiente'],
        expectedResult:
            'La solicitud queda rechazada; se notifica al equipo solicitante',
    },
];

const availabilityCases: TestCase[] = [
    {
        id: 'AVAIL-001',
        requirement: 'RF-MATCH-009',
        title: 'Confirmar disponibilidad propia',
        preconditions: 'Usuario es miembro de un equipo del partido',
        testData: ['estado: "available" / "maybe" / "unavailable"'],
        steps: ['Abrir el partido', 'Seleccionar el estado de disponibilidad'],
        expectedResult:
            'La disponibilidad se guarda para el equipo del usuario; se actualizan las estadísticas',
    },
    {
        id: 'AVAIL-002',
        requirement: 'RF-MATCH-009',
        title: 'Disponibilidad de un no miembro',
        preconditions: 'Usuario no pertenece a ninguno de los equipos',
        testData: ['N/A'],
        steps: ['Intentar registrar disponibilidad en el partido'],
        expectedResult:
            'Acceso denegado (403); solo los miembros pueden marcar disponibilidad',
    },
    {
        id: 'AVAIL-003',
        requirement: 'RF-MATCH-009',
        title: 'Estadísticas y alerta de mínimo',
        preconditions: 'Usuario es líder del equipo',
        testData: ['N/A'],
        steps: ['Abrir el partido y revisar el panel de disponibilidad'],
        expectedResult:
            'Se muestran los conteos (disponibles/quizás/no/pendientes) y una alerta si no se alcanza el mínimo de jugadores',
    },
    {
        id: 'AVAIL-004',
        requirement: 'RF-MATCH-010',
        title: 'Recordatorio automático de disponibilidad',
        preconditions: 'Jugadores con estado pendiente 48h antes del partido',
        testData: ['N/A'],
        steps: [
            'Ejecutar el comando availability:send-reminders (o esperar el schedule)',
        ],
        expectedResult:
            'Se envía recordatorio por email a los jugadores con estado pendiente',
    },
];

const tournamentCases: TestCase[] = [
    {
        id: 'TRN-001',
        requirement: 'RF-TRN-001',
        title: 'Crear torneo con datos válidos',
        preconditions: 'Usuario autenticado',
        testData: [
            'nombre, variante',
            'formato: liga / eliminación / grupos+eliminación',
            'fechas: inscripción < inicio < fin',
        ],
        steps: [
            'Ir a /tournaments/create',
            'Completar los datos y fechas válidas',
            'Guardar',
        ],
        expectedResult: 'Torneo creado en estado borrador',
    },
    {
        id: 'TRN-002',
        requirement: 'RF-TRN-001',
        title: 'Crear torneo con fechas inválidas',
        preconditions: 'Usuario autenticado',
        testData: ['fecha de inicio posterior a la fecha de fin'],
        steps: ['Completar el formulario con fechas incoherentes', 'Guardar'],
        expectedResult:
            'Mensaje de error de validación sobre el orden de las fechas',
    },
    {
        id: 'TRN-003',
        requirement: 'RF-TRN-002',
        title: 'Editar torneo solo por el organizador',
        preconditions: 'Usuario NO es el organizador',
        testData: ['N/A'],
        steps: ['Intentar editar el torneo'],
        expectedResult: 'Acceso denegado (solo el organizador puede editar)',
    },
    {
        id: 'TRN-004',
        requirement: 'RF-TRN-002',
        title: 'Formato bloqueado tras inscripciones',
        preconditions: 'El torneo ya tiene al menos un equipo inscrito',
        testData: ['nuevo formato'],
        steps: ['Intentar cambiar el formato del torneo'],
        expectedResult:
            'Error: no se puede cambiar el formato una vez hay equipos inscritos',
    },
    {
        id: 'TRN-005',
        requirement: 'RF-TRN-003',
        title: 'Abrir inscripciones',
        preconditions: 'Usuario es organizador; torneo en borrador',
        testData: ['N/A'],
        steps: ['Abrir las inscripciones del torneo'],
        expectedResult: 'El torneo pasa a estado "inscripciones abiertas"',
    },
    {
        id: 'TRN-006',
        requirement: 'RF-TRN-004',
        title: 'Iniciar torneo con suficientes equipos',
        preconditions:
            'Organizador; equipos aprobados ≥ mínimo y acorde al formato',
        testData: ['N/A'],
        steps: ['Iniciar el torneo'],
        expectedResult:
            'Se genera el fixture/llave y el torneo pasa a "en progreso"',
    },
    {
        id: 'TRN-007',
        requirement: 'RF-TRN-004',
        title: 'Iniciar torneo sin suficientes equipos',
        preconditions: 'Organizador; equipos aprobados por debajo del mínimo',
        testData: ['N/A'],
        steps: ['Intentar iniciar el torneo'],
        expectedResult:
            'Error indicando que no hay equipos suficientes para el formato',
    },
    {
        id: 'TRN-008',
        requirement: 'RF-TRN-005',
        title: 'Cancelar torneo',
        preconditions: 'Usuario es organizador; torneo no completado',
        testData: ['N/A'],
        steps: ['Cancelar el torneo'],
        expectedResult: 'El torneo queda cancelado',
    },
    {
        id: 'TRN-009',
        requirement: 'RF-TRN-006',
        title: 'Visibilidad de posiciones (invite_only)',
        preconditions: 'Torneo de visibilidad "invite_only"',
        testData: ['N/A'],
        steps: [
            'Intentar ver el torneo como usuario ajeno (ni organizador ni equipo inscrito)',
        ],
        expectedResult:
            'Acceso restringido; los torneos públicos sí son visibles para cualquiera',
    },
];

const tournamentRegistrationCases: TestCase[] = [
    {
        id: 'TREG-001',
        requirement: 'RF-TRN-007',
        title: 'Inscribir equipo en torneo público',
        preconditions:
            'Usuario es líder; variante del equipo = variante del torneo; inscripción abierta',
        testData: ['team_id'],
        steps: ['Abrir el torneo', 'Inscribir un equipo propio'],
        expectedResult:
            'Inscripción "aprobada" automáticamente (torneo público)',
    },
    {
        id: 'TREG-002',
        requirement: 'RF-TRN-007',
        title: 'Inscribir equipo en torneo invite_only',
        preconditions: 'Torneo "invite_only"; usuario es líder del equipo',
        testData: ['team_id'],
        steps: ['Inscribir un equipo propio en el torneo'],
        expectedResult:
            'Inscripción en estado "pendiente" a la espera del organizador',
    },
    {
        id: 'TREG-003',
        requirement: 'RF-TRN-007',
        title: 'Inscribir con variante distinta',
        preconditions: 'La variante del equipo no coincide con la del torneo',
        testData: ['team_id de otra variante'],
        steps: ['Intentar inscribir el equipo'],
        expectedResult:
            'Error: la variante del equipo debe coincidir con la del torneo',
    },
    {
        id: 'TREG-004',
        requirement: 'RF-TRN-008',
        title: 'Aprobar/rechazar inscripción (organizador)',
        preconditions: 'Usuario es organizador; inscripción pendiente',
        testData: ['N/A'],
        steps: ['Aprobar o rechazar una inscripción pendiente'],
        expectedResult:
            'La inscripción queda aprobada/rechazada y se notifica al equipo',
    },
    {
        id: 'TREG-005',
        requirement: 'RF-TRN-009',
        title: 'Retirar inscripción',
        preconditions: 'Usuario es líder del equipo; torneo no en progreso',
        testData: ['N/A'],
        steps: ['Retirar la inscripción del equipo'],
        expectedResult:
            'Inscripción "retirada"; no se permite si el torneo ya está en progreso o finalizado',
    },
];

const onboardingCases: TestCase[] = [
    {
        id: 'ONB-001',
        requirement: 'RF-ACC-001',
        title: 'Redirección forzada a onboarding',
        preconditions: 'Usuario verificado sin onboarding completado',
        testData: ['N/A'],
        steps: ['Intentar acceder a una ruta protegida (ej. /teams)'],
        expectedResult: 'Redirigido a /onboarding',
    },
    {
        id: 'ONB-002',
        requirement: 'RF-ACC-001',
        title: 'Completar onboarding con teléfono',
        preconditions: 'Usuario en /onboarding',
        testData: ['phone_number: "+59891234567"'],
        steps: [
            'Ingresar un número de teléfono válido',
            'Enviar el formulario',
        ],
        expectedResult:
            'Onboarding completado; redirigido a /teams con mensaje de bienvenida',
    },
    {
        id: 'ONB-003',
        requirement: 'RF-ACC-001',
        title: 'Completar onboarding con teléfono inválido',
        preconditions: 'Usuario en /onboarding',
        testData: ['phone_number: "abc"'],
        steps: ['Ingresar un teléfono con formato inválido', 'Enviar'],
        expectedResult: 'Mensaje de error de validación del teléfono',
    },
    {
        id: 'ONB-004',
        requirement: 'RF-ACC-001',
        title: 'Omitir onboarding',
        preconditions: 'Usuario en /onboarding',
        testData: ['N/A'],
        steps: ['Hacer clic en "Omitir"'],
        expectedResult:
            'Onboarding marcado como completado (sin teléfono); redirigido a /teams',
    },
    {
        id: 'ONB-005',
        requirement: 'RF-ACC-001',
        title: 'Onboarding ya completado',
        preconditions: 'Usuario con onboarding ya completado',
        testData: ['N/A'],
        steps: ['Navegar a /onboarding'],
        expectedResult: 'Redirigido al dashboard',
    },
];

const settingsCases: TestCase[] = [
    {
        id: 'SET-001',
        requirement: 'RF-ACC-002',
        title: 'Actualizar datos de perfil',
        preconditions: 'Usuario autenticado',
        testData: ['nombre, teléfono, bio, ubicación, fecha de nacimiento'],
        steps: ['Ir a /settings/profile', 'Modificar los datos', 'Guardar'],
        expectedResult: 'Perfil actualizado correctamente',
    },
    {
        id: 'SET-002',
        requirement: 'RF-ACC-002',
        title: 'Cambiar el email restablece la verificación',
        preconditions: 'Usuario verificado',
        testData: ['nuevo email'],
        steps: [
            'Ir a /settings/profile',
            'Cambiar el correo electrónico',
            'Guardar',
        ],
        expectedResult:
            'El email queda como no verificado y se requiere volver a verificarlo',
    },
    {
        id: 'SET-003',
        requirement: 'RF-ACC-003',
        title: 'Cambiar contraseña',
        preconditions: 'Usuario autenticado',
        testData: ['contraseña actual', 'nueva contraseña + confirmación'],
        steps: [
            'Ir a /settings/password',
            'Ingresar la contraseña actual y la nueva',
            'Guardar',
        ],
        expectedResult:
            'Contraseña actualizada; falla si la contraseña actual es incorrecta',
    },
    {
        id: 'SET-004',
        requirement: 'RF-ACC-004',
        title: 'Subir y quitar avatar',
        preconditions: 'Usuario autenticado',
        testData: ['imagen (jpg/png/webp)'],
        steps: ['Ir a /settings/profile', 'Subir un avatar y luego eliminarlo'],
        expectedResult:
            'El avatar se actualiza y luego se elimina correctamente',
    },
    {
        id: 'SET-005',
        requirement: 'RF-ACC-005',
        title: 'Eliminar la cuenta',
        preconditions: 'Usuario autenticado',
        testData: ['contraseña'],
        steps: [
            'Ir a /settings/profile',
            'Eliminar la cuenta e ingresar la contraseña para confirmar',
        ],
        expectedResult:
            'La cuenta se elimina; falla si no se confirma con la contraseña',
    },
    {
        id: 'SET-006',
        requirement: 'RF-ACC-006',
        title: 'Cambiar apariencia (tema)',
        preconditions: 'Usuario autenticado',
        testData: ['tema: claro / oscuro / sistema'],
        steps: ['Ir a /settings/appearance', 'Cambiar el tema'],
        expectedResult:
            'El tema se aplica y persiste (preferencia del lado del cliente)',
    },
];

const socialCases: TestCase[] = [
    {
        id: 'SOC-001',
        requirement: 'RF-ACC-007',
        title: 'Ver perfil público de un jugador',
        preconditions: 'Ninguna (ruta pública)',
        testData: ['URL /jugadores/{user}'],
        steps: ['Abrir el perfil público de un usuario'],
        expectedResult:
            'Se muestra el perfil con estadísticas, equipos y recomendaciones',
    },
    {
        id: 'SOC-002',
        requirement: 'RF-ACC-008',
        title: 'Comentar en un perfil',
        preconditions: 'Usuario autenticado; perfil de otro usuario',
        testData: ['comentario (máx. 1000)'],
        steps: ['Abrir un perfil ajeno', 'Publicar un comentario'],
        expectedResult:
            'El comentario se publica y se notifica al dueño del perfil',
    },
    {
        id: 'SOC-003',
        requirement: 'RF-ACC-008',
        title: 'No se puede comentar el propio perfil',
        preconditions: 'Usuario autenticado en su propio perfil',
        testData: ['N/A'],
        steps: ['Intentar comentar en el propio perfil'],
        expectedResult: 'Error (no se permite comentar el propio perfil)',
    },
    {
        id: 'SOC-004',
        requirement: 'RF-ACC-008',
        title: 'Eliminar comentario (autor o dueño)',
        preconditions: 'Usuario es autor del comentario o dueño del perfil',
        testData: ['N/A'],
        steps: ['Eliminar un comentario propio o del propio perfil'],
        expectedResult:
            'El comentario se elimina; otros usuarios no pueden eliminarlo (403)',
    },
    {
        id: 'SOC-005',
        requirement: 'RF-ACC-009',
        title: 'Recomendar a un jugador',
        preconditions: 'Usuario autenticado que ha jugado con el otro usuario',
        testData: ['categoría: friendly/skilled/teamwork/leadership'],
        steps: ['Abrir el perfil del jugador', 'Otorgar una recomendación'],
        expectedResult: 'La recomendación se registra en esa categoría',
    },
    {
        id: 'SOC-006',
        requirement: 'RF-ACC-009',
        title: 'Recomendar sin haber jugado juntos',
        preconditions: 'Los usuarios no han jugado juntos',
        testData: ['N/A'],
        steps: ['Intentar recomendar a un jugador con el que no se ha jugado'],
        expectedResult:
            'Error: solo se puede recomendar a jugadores con los que se ha jugado',
    },
    {
        id: 'SOC-007',
        requirement: 'RF-ACC-009',
        title: 'Recomendación duplicada',
        preconditions: 'Ya se otorgó esa categoría al mismo jugador',
        testData: ['misma categoría repetida'],
        steps: ['Intentar recomendar la misma categoría dos veces'],
        expectedResult: 'Error: no se permite duplicar la recomendación',
    },
];

export const testSuites: UseCaseSuite[] = [
    {
        key: 'login',
        label: 'Login',
        category: 'Autenticación',
        description: 'Casos de prueba para el inicio de sesión.',
        cases: loginCases,
    },
    {
        key: 'register',
        label: 'Registro',
        category: 'Autenticación',
        description: 'Casos de prueba para el registro de nuevos usuarios.',
        cases: registerCases,
    },
    {
        key: 'oauth',
        label: 'OAuth',
        category: 'Autenticación',
        description: 'Casos de prueba para la autenticación con Google.',
        cases: oauthCases,
    },
    {
        key: 'password-reset',
        label: 'Contraseña',
        category: 'Autenticación',
        description: 'Casos de prueba para la recuperación de contraseña.',
        cases: passwordResetCases,
    },
    {
        key: 'email-verification',
        label: 'Verificación',
        category: 'Autenticación',
        description:
            'Casos de prueba para la verificación de correo electrónico.',
        cases: emailVerificationCases,
    },
    {
        key: 'two-factor',
        label: '2FA',
        category: 'Autenticación',
        description:
            'Casos de prueba para la autenticación de dos factores (2FA).',
        cases: twoFactorCases,
    },
    {
        key: 'teams',
        label: 'Equipos',
        category: 'Equipos',
        description: 'Casos de prueba para la gestión de equipos.',
        cases: teamCases,
    },
    {
        key: 'team-invitations',
        label: 'Invitaciones',
        category: 'Equipos',
        description: 'Casos de prueba para las invitaciones a equipos.',
        cases: invitationCases,
    },
    {
        key: 'join-requests',
        label: 'Solicitudes',
        category: 'Equipos',
        description:
            'Casos de prueba para las solicitudes de ingreso a equipos.',
        cases: joinRequestCases,
    },
    {
        key: 'matches',
        label: 'Partidos',
        category: 'Partidos',
        description: 'Casos de prueba para la gestión de partidos.',
        cases: matchCases,
    },
    {
        key: 'match-requests',
        label: 'Emparejamiento',
        category: 'Partidos',
        description: 'Casos de prueba para las solicitudes de partido.',
        cases: matchRequestCases,
    },
    {
        key: 'availability',
        label: 'Disponibilidad',
        category: 'Partidos',
        description:
            'Casos de prueba para la disponibilidad de jugadores en partidos.',
        cases: availabilityCases,
    },
    {
        key: 'tournaments',
        label: 'Torneos',
        category: 'Torneos',
        description: 'Casos de prueba para la gestión de torneos.',
        cases: tournamentCases,
    },
    {
        key: 'tournament-registrations',
        label: 'Inscripciones',
        category: 'Torneos',
        description: 'Casos de prueba para las inscripciones a torneos.',
        cases: tournamentRegistrationCases,
    },
    {
        key: 'onboarding',
        label: 'Onboarding',
        category: 'Cuenta',
        description: 'Casos de prueba para el proceso de onboarding.',
        cases: onboardingCases,
    },
    {
        key: 'settings',
        label: 'Configuración',
        category: 'Cuenta',
        description: 'Casos de prueba para la configuración de la cuenta.',
        cases: settingsCases,
    },
    {
        key: 'social',
        label: 'Perfil y social',
        category: 'Cuenta',
        description:
            'Casos de prueba para el perfil público, comentarios y recomendaciones.',
        cases: socialCases,
    },
];
