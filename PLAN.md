# Plan — Web Tameana (terapeuta / sesiones de acompañamiento)

Web en español para una terapeuta. Intro con logo que respira → hub con 3 secciones → páginas de contenido → sistema de reservas propio (sin pago, confirmación manual). Stripe previsto para el futuro. **Todo el stack es nativo de Cloudflare.**

## Stack

- **Astro (última versión) con SSR** + adaptador oficial `@astrojs/cloudflare`
- **TypeScript** en todo el proyecto
- **Tailwind CSS** (paleta como tokens de tema)
- **Base de datos: Cloudflare D1** (SQLite gestionado) con **Drizzle ORM**
- **Formularios/mutaciones: Astro Actions** (validación con `zod` integrada)
- **Emails: Resend** (única pieza externa; se llama vía API desde el Worker)
- **Anti-spam: Cloudflare Turnstile** (nativo, gratis, sin CAPTCHAs molestos)
- **Deploy: Cloudflare Workers** (via `wrangler`), dominio ya en Cloudflare
- Páginas de contenido pre-renderizadas (`prerender = true`); solo `/reservar`, `/admin` y las actions corren en servidor.
- Sin autenticación de clientes. Admin protegido con contraseña (env var + cookie firmada httpOnly).

## Paleta

| Token | Hex | Uso |
|---|---|---|
| `bg` | `#F7F6F4` | Fondo general |
| `surface` | `#D7E9E9` | Tarjetas, superficies secundarias |
| `accent-soft` | `#B0F3F3` | Hovers, detalles, glow de la animación |
| `primary` | `#51B9B9` | Botones, iconos, enlaces |
| `ink` | `#081A1A` | Texto y fondo oscuro |

Reglas de contraste: el texto de cuerpo siempre en `ink` sobre `bg`/`surface`. **No usar texto blanco pequeño sobre `primary`** (no pasa AA); en botones `primary`, texto en `ink`. `accent-soft` nunca como color de texto.

Tipografía: una serif suave para títulos (ej. Fraunces o Cormorant) + una sans legible para cuerpo (ej. Inter o Nunito Sans), autoalojadas (`@fontsource`), sin Google Fonts externo. Tono visual: calma, aire, mucho espacio en blanco, bordes redondeados generosos.

## Estructura de páginas

```
/                  → Intro: logo respirando, clic → /inicio          (estática)
/inicio            → Hub: 3 iconos (Quién soy · Sesiones · Tameana)  (estática)
/quien-soy         → Presentación de la terapeuta                    (estática)
/sesiones          → Cómo se acompaña, el proceso, CTA "Reservar"    (estática)
/tameana           → 5 modalidades tipo "productos" con CTA          (estática)
/reservar          → Calendario de huecos + formulario (?servicio=)  (SSR)
/gracias           → Confirmación de solicitud recibida              (estática)
/admin             → Reservas, confirmar/cancelar (protegido)        (SSR)
```

### 1. Intro `/`
- Pantalla completa, fondo `bg`, logo centrado (usar **placeholder**: círculo/forma abstracta en SVG con los colores de la paleta; el logo real se sustituirá después — dejarlo como componente `<Logo />` aislado para que el cambio sea trivial).
- Animación "respiración": `scale` 1 → 1.06 con glow suave en `accent-soft`, ciclo ~4.5s, `ease-in-out`, CSS puro (`@keyframes`).
- Respetar `prefers-reduced-motion`: sin animación, logo estático.
- Todo el logo es un enlace a `/inicio`. Texto sutil debajo tipo "entrar" que aparece con fade tras 2s.
- Transición suave al entrar (View Transitions de Astro).

### 2. Hub `/inicio`
- 3 iconos grandes (SVG de línea, trazo `primary`, placeholders coherentes: persona, manos, espiral) con etiqueta debajo. Hover: leve escala + fondo `surface`.
- Fila en desktop, columna en móvil.
- Header mínimo persistente en el resto de páginas (logo pequeño → `/inicio`, nav con las 3 secciones).

### 3. Quién soy `/quien-soy`
- Foto placeholder + texto de presentación (provisional en español, marcado con `<!-- TODO: texto real -->`).
- Cierre con CTA suave hacia `/sesiones`.

### 4. Sesiones de acompañamiento `/sesiones`
- Explicación del enfoque y del proceso (qué es, cómo es una sesión, duración). Placeholders.
- CTA principal: "Reservar una sesión" → `/reservar?servicio=acompanamiento`.

### 5. Tameana `/tameana`
- Intro breve de qué es tameana (placeholder).
- 5 tarjetas (grid 2-3 columnas desktop, 1 en móvil), cada una con icono placeholder, título, descripción breve y botón "Reservar":
  1. Tameana para adultos
  2. Tameana para niños
  3. Tameana para espacios
  4. Tameana grupal
  5. Tameana para animales
- Botón → `/reservar?servicio=<slug>`.

## Sistema de reservas (núcleo del proyecto)

### Modelo de datos (D1 / SQLite, esquema con Drizzle)

```
services
  id, slug, nombre, descripcion, duracion_min, precio_cents (nullable),
  activo (bool), orden

availability_rules            -- disponibilidad semanal recurrente
  id, dia_semana (0-6), hora_inicio, hora_fin

availability_exceptions      -- vacaciones / bloqueos puntuales
  id, fecha, hora_inicio (nullable = día entero), hora_fin (nullable)

bookings
  id, service_id, fecha, hora_inicio, hora_fin,
  nombre, email, telefono, mensaje (nullable),
  estado ('pendiente' | 'confirmada' | 'cancelada'),
  payment_status ('no_aplica' por defecto),   -- previsto para Stripe
  created_at
```

- Migraciones con `drizzle-kit` + `wrangler d1 migrations`.
- **Índice único parcial** en `bookings (fecha, hora_inicio) WHERE estado != 'cancelada'` → evita doble reserva a nivel de base de datos (SQLite lo soporta).
- Seed inicial: los 6 servicios (acompañamiento + 5 tameana), disponibilidad L-V 10:00–14:00 y 16:00–19:00 como ejemplo (fácil de cambiar).
- Desarrollo local: `wrangler dev` usa una D1 local automáticamente.

### Generación de huecos
- Función de servidor `getAvailableSlots(serviceId, fecha)`: expande `availability_rules` del día, resta `availability_exceptions` y `bookings` no canceladas, trocea según `duracion_min` del servicio + buffer configurable (15 min por defecto).
- Zona horaria fija `Europe/Madrid` (guardar fecha+hora locales como texto, sin UTC ambiguo). `date-fns` + `date-fns-tz`.
- No mostrar huecos con menos de 24h de antelación (configurable).

### Flujo de reserva `/reservar`
1. Selector de servicio (preseleccionado si viene `?servicio=`).
2. Calendario mensual a medida (sin librería pesada; días sin huecos deshabilitados) → al elegir día, lista de horas. La isla interactiva puede ser un componente Astro con un poco de JS o una isla Preact — elegir lo más ligero que resulte cómodo.
3. Formulario: **nombre*, email*, teléfono*, mensaje opcional** + widget Turnstile. Validación `zod` en la Action (cliente y servidor).
4. Astro Action `createBooking` que:
   - Verifica el token de Turnstile.
   - Inserta la reserva en estado `pendiente`; si el índice único salta (hueco ya cogido), devuelve error claro al usuario ("esa hora acaba de ocuparse").
   - Email al terapeuta (Resend): datos completos de la solicitud.
   - Email al cliente: "Hemos recibido tu solicitud, te confirmaremos en breve. El pago se realiza en la sesión."
5. Redirect a `/gracias`.

### Admin `/admin`
- Login: contraseña única (`ADMIN_PASSWORD` como secret de Wrangler) → cookie httpOnly firmada. Middleware de Astro protege `/admin/*`.
- Tabla de reservas (próximas primero) con estado y botones **Confirmar** / **Cancelar** (Astro Actions).
- Al confirmar → email al cliente con fecha/hora confirmadas. Al cancelar → email de cancelación.
- Fase posterior (no ahora): CRUD de disponibilidad desde el admin. De momento la disponibilidad se edita vía seed/SQL.

### Stripe (previsto, NO implementar ahora)
- `precio_cents` y `payment_status` ya en el esquema.
- Flag `PAYMENTS_ENABLED=false`. En `createBooking`, punto de inserción comentado: si el flag está activo → redirect a Stripe Checkout en vez de `/gracias`; un endpoint webhook actualizaría `payment_status`.
- No instalar SDK de Stripe todavía; solo dejar la arquitectura preparada.

## Detalles transversales

- Todo en **español** (`lang="es"`), placeholders marcados con `TODO`.
- Responsive mobile-first.
- SEO: metadata por página, OG tags, `sitemap.xml` (integración `@astrojs/sitemap`), `robots.txt`.
- Accesibilidad: foco visible, `aria-labels` en iconos-enlace, contraste según reglas de paleta, `prefers-reduced-motion`.
- Config: `wrangler.toml` con binding D1; secrets (`RESEND_API_KEY`, `THERAPIST_EMAIL`, `ADMIN_PASSWORD`, `TURNSTILE_SECRET`, `PAYMENTS_ENABLED`) vía `wrangler secret`. Incluir `.dev.vars.example` para desarrollo local.
- Componentes clave aislados: `<Logo />`, `<Icon />`, `<ServiceCard />`, `<BookingCalendar />`, `<TimeSlotPicker />`, `<BookingForm />`.

## Orden de implementación

1. **Fase 1 — Estructura y diseño**: proyecto Astro + adaptador Cloudflare + Tailwind con tokens, todas las páginas con placeholders, animación del logo, navegación completa, deploy inicial a Workers. *(La web ya se puede enseñar en una URL real.)*
2. **Fase 2 — Reservas**: D1 + esquema + migraciones + seed, generación de huecos, `/reservar` completo con Turnstile y emails.
3. **Fase 3 — Admin**: login, listado, confirmar/cancelar con emails.
4. **Fase 4 — Futuro**: Stripe Checkout, gestión de disponibilidad desde admin.

Al final de cada fase: `astro build` sin errores, probar en `wrangler dev` y en el deploy real, revisar en móvil y desktop, y probar el flujo completo de reserva con datos de prueba.
