# Manual de Usuario — Veltro

Veltro es una plataforma web para equipos de fútbol amateur de Uruguay. Te
permite crear y administrar equipos, organizar partidos, seguir estadísticas,
gestionar torneos y conectarte con otros equipos y jugadores.

Este manual describe, paso a paso, todas las funcionalidades disponibles para
el usuario.

> **Sobre las imágenes de este manual**
> A lo largo del documento vas a encontrar marcadores de imagen como el de
> abajo, que indican dónde debe ir cada captura de pantalla de la aplicación.
> Reemplazá cada archivo `images/<nombre>.png` por la captura correspondiente
> (se recomienda un ancho de ~1200 px y formato PNG). La carpeta sugerida es
> `docs/images/`.

![Pantalla de bienvenida de Veltro](images/00-landing.png)
*Figura 0: Página de inicio de Veltro.*

---

## Índice

1. [Primeros pasos](#1-primeros-pasos)
2. [Tu cuenta y seguridad](#2-tu-cuenta-y-seguridad)
3. [El panel principal (Dashboard)](#3-el-panel-principal-dashboard)
4. [Tu perfil de jugador](#4-tu-perfil-de-jugador)
5. [Equipos](#5-equipos)
6. [Partidos](#6-partidos)
7. [Torneos](#7-torneos)
8. [Notificaciones](#8-notificaciones)
9. [Ajustes](#9-ajustes)
10. [Preguntas frecuentes](#10-preguntas-frecuentes)

---

## 1. Primeros pasos

### 1.1. Crear una cuenta

Podés registrarte de dos maneras:

- **Con correo y contraseña:** desde la página de inicio, elegí **Registrarse**
  e ingresá tu nombre, correo electrónico y una contraseña.
- **Con Google:** usá el botón **Continuar con Google** para registrarte o
  ingresar con tu cuenta de Google, sin necesidad de recordar otra contraseña.

![Formulario de registro e inicio de sesión](images/01-registro.png)
*Figura 1: Pantalla de registro / inicio de sesión, con la opción de Google.*

### 1.2. Verificar tu correo

Si te registraste con correo y contraseña, Veltro te enviará un email de
verificación. Tenés que hacer clic en el enlace del correo antes de poder usar
la plataforma. Las cuentas creadas con Google ya vienen verificadas.

### 1.3. Onboarding: número de teléfono

La primera vez que ingresás, se te pedirá completar tu **número de teléfono**.
Este dato es importante porque permite que los capitanes de los equipos rivales
puedan coordinar los partidos confirmados con vos. Podés omitir este paso, pero
te recomendamos completarlo para aprovechar toda la plataforma.

![Paso de onboarding para cargar el número de teléfono](images/02-onboarding-telefono.png)
*Figura 2: Paso de onboarding donde se ingresa el número de teléfono.*

---

## 2. Tu cuenta y seguridad

### 2.1. Autenticación en dos pasos (2FA)

Para mayor seguridad podés activar la **verificación en dos pasos**:

1. Andá a **Ajustes → Autenticación en dos pasos**.
2. Confirmá tu contraseña.
3. Escaneá el código QR con una app de autenticación (Google Authenticator,
   Authy, etc.).
4. Guardá los **códigos de recuperación** en un lugar seguro: te sirven para
   entrar si perdés el acceso a tu app de autenticación.

Una vez activada, cada vez que inicies sesión (incluso si entrás con Google) se
te pedirá el código de verificación.

![Configuración de 2FA con código QR y códigos de recuperación](images/03-2fa.png)
*Figura 3: Activación de la autenticación en dos pasos (código QR y códigos de
recuperación).*

### 2.2. Cambiar la contraseña

Desde **Ajustes → Contraseña** podés actualizar tu contraseña en cualquier
momento.

---

## 3. El panel principal (Dashboard)

Al ingresar, llegás al **panel principal**, que reúne un resumen de tu actividad:

![Panel principal con el resumen de actividad](images/04-dashboard.png)
*Figura 4: Panel principal (dashboard) con equipos, próximos partidos y más.*

- **Mis equipos:** los equipos de los que sos miembro activo.
- **Próximos partidos:** los siguientes partidos programados o confirmados de
  tus equipos.
- **Partidos abiertos:** partidos disponibles de otros equipos, de tu misma
  modalidad, a los que podrías desafiar.
- **Solicitudes de ingreso:** las que enviaste a otros equipos (pendientes) y
  las que recibiste en los equipos que liderás.
- **Torneos activos:** torneos en los que participan tus equipos.
- **Descubrir equipos:** sugerencias de equipos para explorar.

> Nota: en el panel solo aparecen los equipos en los que sos **miembro activo**.

---

## 4. Tu perfil de jugador

Cada jugador tiene un **perfil público** accesible para otros usuarios de la
plataforma. En él se muestra tu nombre, tu foto, tus equipos y los
reconocimientos y comentarios que recibiste.

![Perfil público de un jugador](images/05-perfil-jugador.png)
*Figura 5: Perfil público de un jugador con sus equipos, reconocimientos y
comentarios.*

### 4.1. Foto de perfil (avatar)

Desde **Ajustes → Perfil** podés subir o quitar tu foto de perfil. Si entraste
con Google, se usa tu foto de Google por defecto.

### 4.2. Reconocimientos (commendations)

Otros jugadores pueden dejarte **reconocimientos** en tu perfil, según cómo te
desempeñás dentro y fuera de la cancha. Las categorías son:

- **Amigable** — jugador de buen trato.
- **Habilidoso** — excelentes habilidades en el campo.
- **Trabajo en equipo** — trabaja bien con el equipo.
- **Liderazgo** — lidera y motiva al equipo.

Para dar un reconocimiento, entrá al perfil del jugador y seleccioná las
categorías correspondientes. Podés quitar un reconocimiento que hayas dado.

![Diálogo para dar reconocimientos a un jugador](images/06-reconocimientos.png)
*Figura 6: Selección de reconocimientos (amigable, habilidoso, trabajo en
equipo, liderazgo).*

### 4.3. Comentarios en el perfil

Los usuarios registrados pueden dejar **comentarios** en el perfil de otros
jugadores. Podés eliminar los comentarios que vos mismo hayas escrito.

---

## 5. Equipos

### 5.1. Modalidades disponibles

Al crear un equipo elegís su modalidad, que define la cantidad de jugadores:

| Modalidad   | Jugadores |
|-------------|-----------|
| Fútbol 11   | 11        |
| Fútbol 7    | 7         |
| Fútbol 5    | 5         |
| Futsal      | 5         |

### 5.2. Crear un equipo

La creación de un equipo se hace mediante un **asistente de 3 pasos**
(Identidad → Variante → Detalles). A la derecha vas viendo una **vista previa en
vivo** de cómo quedará tu equipo mientras lo armás. Al finalizar, quedás
automáticamente como **capitán**.

**Paso 0 — Abrir el asistente.**
Andá a **Equipos → Crear equipo**. Se abre el asistente con la barra de progreso
"Paso 1 de 3" y la vista previa a un costado.

![Asistente de creación de equipo recién abierto](images/07a-crear-equipo-inicio.png)
*Figura 7a: Pantalla inicial del asistente de creación de equipo, con la barra de
progreso y la vista previa en vivo.*

**Paso 1 — Identidad (nombre y escudo).**
En el primer paso le das identidad al equipo:

1. **Escudo del equipo (opcional):** arrastrá una imagen al recuadro o hacé clic
   en **Subir escudo**. Se aceptan archivos **JPG, PNG o WEBP** de hasta **2 MB**.
   Podés **Cambiar** o **Quitar** el escudo si te equivocaste.
2. **Nombre del equipo (obligatorio):** escribí el nombre (por ejemplo,
   *Los Tigres FC*). Es el único campo requerido; hasta que no lo completes, el
   botón **Continuar** permanece deshabilitado.

Cuando estés listo, hacé clic en **Continuar**.

![Paso de identidad: carga del escudo y nombre del equipo](images/07b-crear-equipo-identidad.png)
*Figura 7b: Paso "Identidad" — zona para subir el escudo y campo de nombre.*

**Paso 2 — Variante (modalidad).**
Elegí la **modalidad** de tu equipo entre las tarjetas disponibles: **Fútbol 11**,
**Fútbol 7**, **Fútbol 5** o **Futsal**. Cada tarjeta muestra cuántos jugadores
van **en cancha** y la **cantidad de cupos** del plantel. La modalidad define el
cupo máximo de integrantes. Seleccioná una y hacé clic en **Continuar** (podés
volver con **Atrás**).

![Paso de variante: selección de la modalidad de fútbol](images/07c-crear-equipo-variante.png)
*Figura 7c: Paso "Variante" — tarjetas para elegir la modalidad (11, 7, 5 o
futsal).*

**Paso 3 — Detalles y confirmación.**
En el último paso podés agregar una **descripción** opcional del equipo (su
estilo, su historia, etc.), de hasta **1000 caracteres**. Debajo verás un
**Resumen** con el nombre, la modalidad y si cargaste escudo. Cuando esté todo
correcto, hacé clic en **Crear Equipo**.

![Paso de detalles: descripción y resumen antes de crear](images/07d-crear-equipo-detalles.png)
*Figura 7d: Paso "Detalles" — descripción opcional y resumen final antes de
confirmar.*

Al confirmar, se crea el equipo y se te redirige a su página. ¡Ya sos el
**capitán**!

### 5.3. Roles dentro del equipo

Hay tres roles con distintos permisos:

- **Capitán:** control total. Puede editar y eliminar el equipo, gestionar
  miembros, transferir la capitanía y administrar partidos y torneos.
- **Subcapitán (co-capitán):** puede gestionar el equipo (miembros, partidos,
  invitaciones), pero **no** puede eliminar el equipo ni transferir la capitanía.
- **Jugador:** miembro base. Puede ver la información del equipo, sus partidos y
  confirmar su disponibilidad.

> A los capitanes y subcapitanes se los denomina en conjunto **líderes** del
> equipo.

![Página de un equipo con su plantel y roles](images/08-equipo-detalle.png)
*Figura 8: Página de detalle de un equipo, con el plantel, roles y posiciones.*

### 5.4. Posiciones

A cada miembro se le puede asignar una posición de juego: **arquero**,
**defensor**, **mediocampista** o **delantero**. Los líderes pueden actualizar
la posición de los integrantes.

### 5.5. Sumar jugadores

Hay dos formas de que se sume gente al equipo:

**a) Invitaciones (desde el equipo hacia el jugador):**
Un líder genera un **enlace de invitación** desde la página del equipo. Al
compartirlo, quien lo reciba puede aceptar la invitación e ingresar al equipo.
Los líderes pueden ver las invitaciones activas y **revocarlas**. Una invitación
puede aparecer como **expirada** o **revocada** si ya no es válida.

**b) Solicitudes de ingreso (desde el jugador hacia el equipo):**
Cualquier jugador puede **buscar equipos** y enviar una **solicitud de ingreso**.
Los líderes del equipo reciben la solicitud y pueden **aceptarla** o
**rechazarla**. Podés cancelar una solicitud que enviaste mientras siga
pendiente, y consultar el estado de todas tus solicitudes.

![Búsqueda de equipos y envío de solicitud de ingreso](images/09-buscar-equipos.png)
*Figura 9: Búsqueda de equipos y solicitud de ingreso.*

### 5.6. Gestionar miembros

Los líderes pueden:

- **Cambiar el rol** de un integrante (por ejemplo, ascender a subcapitán).
- **Cambiar la posición** de un integrante.
- **Quitar** a un integrante del equipo.
- **Transferir la capitanía** a otro miembro (solo el capitán).

Cualquier miembro puede **abandonar el equipo** cuando quiera.

### 5.7. Logo del equipo

Los líderes pueden subir o quitar el **logo** del equipo desde la página del
equipo.

---

## 6. Partidos

### 6.1. ¿Cómo funciona un partido?

El flujo típico de un partido amistoso es:

1. **Creación:** un líder del equipo local publica la disponibilidad de un
   partido (fecha, lugar y notas). El partido queda en estado **disponible**.
2. **Solicitud:** un líder de otro equipo, de la misma modalidad, solicita jugar
   ese partido. El partido pasa a **pendiente**.
3. **Confirmación:** el equipo local acepta la solicitud y el partido queda
   **confirmado**.
4. **Coordinación:** ambos equipos ven los datos de contacto de los líderes
   rivales para coordinar detalles.
5. **Disponibilidad:** los jugadores de ambos equipos confirman su asistencia.
6. **En juego / Finalizado:** llegada la hora, el partido puede pasar a **en
   curso** y luego **finalizado**, con su resultado cargado.

Un partido también puede quedar **cancelado**.

![Página de detalle de un partido](images/10-partido-detalle.png)
*Figura 10: Detalle de un partido con su estado, equipos y datos de coordinación.*

### 6.2. Estados de un partido

| Estado       | Significado                                             |
|--------------|--------------------------------------------------------|
| Disponible   | Publicado, esperando rival.                            |
| Pendiente    | Hay una solicitud de rival esperando confirmación.     |
| Confirmado   | Rival confirmado; partido acordado.                    |
| En curso     | El partido está en juego.                              |
| Finalizado   | El partido terminó y tiene resultado.                  |
| Cancelado    | El partido fue cancelado.                              |

### 6.3. Publicar un partido

Desde **Partidos → Publicar disponibilidad** (o el botón de crear), elegí el
equipo (debés ser líder), la **fecha y hora**, el **lugar** y agregá **notas**
si querés. Solo los líderes pueden publicar y administrar partidos.

![Formulario para publicar la disponibilidad de un partido](images/11-crear-partido.png)
*Figura 11: Publicación de un partido (equipo, fecha, lugar y notas).*

### 6.4. Ver tus partidos

En la sección **Partidos** ves:

- **Mis partidos:** el historial y los próximos partidos de todos los equipos de
  los que sos **miembro** (sin importar tu rol: también los ven los jugadores
  base, no solo los líderes).
- **Partidos disponibles:** partidos abiertos de otros equipos de tu modalidad,
  que podés filtrar por búsqueda (nombre del equipo o lugar).

![Listado de partidos: mis partidos y partidos disponibles](images/12-partidos-listado.png)
*Figura 12: Sección de partidos con "Mis partidos" y "Partidos disponibles".*

### 6.5. Solicitar y aceptar partidos

- Para jugar un partido disponible, un líder envía una **solicitud** indicando
  con qué equipo desea jugar y, opcionalmente, un mensaje.
- El equipo local puede **aceptar** (queda confirmado) o **rechazar** la
  solicitud.

### 6.6. Confirmar tu disponibilidad

Una vez que sos parte de un partido, indicá tu asistencia con el selector de
disponibilidad. Los estados posibles son:

- **Pendiente** — todavía no respondiste.
- **Disponible** — confirmás que vas.
- **Tal vez** — no estás seguro.
- **No disponible** — no podés ir.

Los líderes ven las **estadísticas de disponibilidad** de todo el plantel
(cuántos confirmaron, cuántos faltan, etc.) y el **mínimo de jugadores**
necesario según la modalidad (11, 7 o 5).

![Selector de disponibilidad y estadísticas del plantel](images/13-disponibilidad.png)
*Figura 13: Selector de disponibilidad del jugador y estadísticas para los
líderes.*

> **Recordatorios automáticos:** Veltro envía un recordatorio por correo a
> quienes tengan la disponibilidad **pendiente**, aproximadamente **48 horas
> antes** del partido.

### 6.7. Alineaciones (lineups)

Para los partidos confirmados, los líderes pueden armar la **alineación**:
elegir titulares y suplentes de entre los jugadores del equipo.

![Armado de la alineación del equipo](images/14-alineacion.png)
*Figura 14: Editor de alineación (titulares y suplentes).*

### 6.8. Eventos y resultado

Durante o después del partido, los líderes pueden registrar los **eventos**:

- Goles y asistencias.
- Tarjetas amarillas y rojas.
- Sustituciones (entra / sale).

También pueden **cargar el marcador** (una vez llegada la hora del partido) y
**finalizar** el partido. Estas estadísticas alimentan el historial de cada
jugador y equipo.

![Registro de eventos y carga del marcador](images/15-eventos-marcador.png)
*Figura 15: Carga del marcador y registro de goles, asistencias y tarjetas.*

---

## 7. Torneos

Veltro permite organizar y participar en **torneos** entre equipos.

### 7.1. Formatos disponibles

- **Eliminación directa:** llave a partido único; el que pierde queda eliminado.
- **Liga (todos contra todos):** los equipos se enfrentan entre sí y se ordenan
  por puntos en una tabla.
- **Fase de grupos + eliminatoria:** primero grupos y luego una llave final con
  los mejores clasificados.

### 7.2. Crear un torneo

Desde **Torneos → Crear torneo**, definí el nombre, la modalidad, el formato y
los parámetros correspondientes (por ejemplo, cantidad y tamaño de grupos en el
formato de grupos). Quien crea el torneo es su **organizador**.

También podés subir un **logo** para el torneo.

![Formulario de creación de torneo](images/16-crear-torneo.png)
*Figura 16: Creación de un torneo (nombre, modalidad y formato).*

### 7.3. Inscripciones

1. El organizador **abre las inscripciones**.
2. Los líderes de otros equipos **inscriben** a su equipo.
3. El organizador **aprueba** o **rechaza** cada inscripción.
4. Un equipo puede **retirar** su inscripción si aún no comenzó el torneo.

### 7.4. Sorteo de grupos

En el formato de **fase de grupos + eliminatoria**, el organizador realiza el
**sorteo** para distribuir los equipos aprobados en los grupos. También puede
**deshacer** el sorteo para rehacerlo.

### 7.5. Comenzar y gestionar el torneo

- El organizador **inicia** el torneo, lo que genera el fixture / la llave según
  el formato.
- El organizador puede **programar** cada partido del torneo (fecha, hora y
  lugar).
- En los partidos de torneo, **el organizador es el único responsable** de
  cargar resultados, goles y alineaciones (a diferencia de los amistosos, donde
  lo hacen los líderes de cada equipo).
- El torneo muestra la **tabla de posiciones** o la **llave (bracket)** según
  corresponda, y avanza de fase automáticamente.
- El organizador puede **cancelar** el torneo.

![Vista de un torneo con la tabla o la llave](images/17-torneo-detalle.png)
*Figura 17: Detalle de un torneo mostrando la tabla de posiciones o la llave
(bracket).*

---

## 8. Notificaciones

Veltro te mantiene al día por varios canales:

- **Notificaciones en la app:** un panel dentro de la plataforma con las
  novedades (solicitudes, confirmaciones de partidos, cambios en torneos, etc.).
  Podés marcarlas como leídas de a una o todas juntas, y eliminarlas.
- **Notificaciones push del navegador:** si las activás, recibís avisos aunque no
  tengas la pestaña abierta.
- **Correos electrónicos:** para eventos importantes, como el recordatorio de
  disponibilidad 48 horas antes de un partido.

Podés ajustar tus preferencias en **Ajustes → Notificaciones**.

![Panel de notificaciones dentro de la app](images/18-notificaciones.png)
*Figura 18: Panel de notificaciones en la aplicación.*

---

## 9. Ajustes

Desde el menú **Ajustes** administrás tu cuenta:

- **Perfil:** nombre, datos personales y foto de perfil. También podés
  **eliminar tu cuenta** desde aquí.
- **Contraseña:** cambiar tu contraseña.
- **Apariencia:** elegir el tema claro u oscuro de la interfaz.
- **Notificaciones:** preferencias de avisos y notificaciones push.
- **Autenticación en dos pasos:** activar o desactivar el 2FA.

![Sección de ajustes de la cuenta](images/19-ajustes.png)
*Figura 19: Menú de ajustes (perfil, contraseña, apariencia, notificaciones y
2FA).*

---

## 10. Preguntas frecuentes

**No veo los partidos de mi equipo.**
Asegurate de ser **miembro activo** del equipo. Todos los miembros —incluidos
los jugadores base— ven los partidos de sus equipos en la sección *Partidos* y
en el panel principal.

**¿Por qué no puedo crear un partido o inscribir a mi equipo en un torneo?**
Esas acciones están reservadas a los **líderes** (capitán o subcapitán) del
equipo. Pedile a un líder que te ascienda o que realice la acción.

**¿Por qué me piden el código de verificación si entré con Google?**
Porque tenés activada la **autenticación en dos pasos**. Por seguridad, el 2FA
se exige incluso al ingresar con Google.

**Perdí el acceso a mi app de autenticación.**
Usá uno de los **códigos de recuperación** que guardaste al activar el 2FA.

**¿Puedo estar en varios equipos a la vez?**
Sí. Podés pertenecer a varios equipos, incluso de distintas modalidades.

**¿Para qué sirve mi número de teléfono?**
Permite que los líderes del equipo rival puedan coordinar con vos los partidos
**confirmados**. Solo se comparte en ese contexto.

---

*Veltro — Fútbol amateur en Uruguay.*
