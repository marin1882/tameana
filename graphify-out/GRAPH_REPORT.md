# Graph Report - tameana  (2026-07-28)

## Corpus Check
- 56 files · ~81,438 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1232 nodes · 1361 edges · 40 communities (23 shown, 17 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]

## God Nodes (most connected - your core abstractions)
1. `scripts` - 12 edges
2. `StreamError` - 11 edges
3. `getDb()` - 9 edges
4. `../layouts/PageLayout.astro` - 9 edges
5. `../layouts/BaseLayout.astro` - 8 edges
6. `getAvailableSlots()` - 7 edges
7. `getAvailableDaysInMonth()` - 7 edges
8. `Event` - 7 edges
9. `ExtendableEvent` - 7 edges
10. `Plan — Web Tameana (terapeuta / sesiones de acompañamiento)` - 7 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `getDb()`  [EXTRACTED]
  src/pages/api/available-days.ts → src/db/index.ts
- `GET()` --calls--> `getDb()`  [EXTRACTED]
  src/pages/api/slots.ts → src/db/index.ts
- `GET()` --calls--> `getAvailableSlots()`  [EXTRACTED]
  src/pages/api/slots.ts → src/lib/slots.ts
- `GET()` --calls--> `getAvailableDaysInMonth()`  [EXTRACTED]
  src/pages/api/available-days.ts → src/lib/slots.ts

## Import Cycles
- None detected.

## Communities (40 total, 17 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.00
Nodes (952): AbortController, AgentMemoryGetSummaryOptions, AgentMemoryGetSummaryResponse, AgentMemoryIncomingMemory, AgentMemoryIngestOptions, AgentMemoryListMemoriesOptions, AgentMemoryListMemoriesResult, AgentMemoryMemory (+944 more)

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (35): db, server, db, historicas, number, proximas, string, GET() (+27 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (23): ../components/BreathingLogo.astro, ../components/CTALink.astro, ../components/Header.astro, navItems, ../components/Icon.astro, sizeMap, string, ../components/ServiceCard.astro (+15 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (32): dependencies, astro, @astrojs/check, @astrojs/cloudflare, @astrojs/sitemap, date-fns, date-fns-tz, drizzle-kit (+24 more)

### Community 4 - "Community 4"
Cohesion: 0.11
Nodes (17): 1. Intro `/`, 2. Hub `/inicio`, 3. Quién soy `/quien-soy`, 4. Sesiones de acompañamiento `/sesiones`, 5. Tameana `/tameana`, Admin `/admin`, Detalles transversales, Estructura de páginas (+9 more)

### Community 5 - "Community 5"
Cohesion: 0.17
Nodes (12): CloseEvent, CustomEvent, EmailEvent, ErrorEvent, Event, ExtendableEvent, FetchEvent, MessageEvent (+4 more)

### Community 6 - "Community 6"
Cohesion: 0.18
Nodes (11): AlreadyUploadedError, BadRequestError, ForbiddenError, InternalError, InvalidURLError, MaxFileSizeError, NotFoundError, QuotaReachedError (+3 more)

### Community 7 - "Community 7"
Cohesion: 0.20
Nodes (9): Bugs arreglados — Calendario y disponibilidad, Cambios, Commits, Dominio y branding, Emails — diagnóstico y fix final, Mini-CRM + Páginas legales + Footer, Pendiente, Sesión 2026-07-11 (+1 more)

### Community 8 - "Community 8"
Cohesion: 0.20
Nodes (9): Cambio de email de terapeuta, Cambios, Commits, Deploy, Pendiente, Reset de contraseña admin, Sesión 2026-07-28, Textos reales y modal "+ info" en modalidades (+1 more)

### Community 9 - "Community 9"
Cohesion: 0.22
Nodes (8): Archivos modificados, Cambios, Campo de estrellas + Pléyades, Commits, Migración de colores hardcodeados, Modo oscuro — Tema azul noche, Pendiente, Sesión 2026-07-14

### Community 10 - "Community 10"
Cohesion: 0.25
Nodes (7): Cambios, Commits, Correcciones importantes, Fase 2 — Sistema de reservas, Fase 3 — Panel de administración, Pendiente, Sesión 2026-07-10

### Community 11 - "Community 11"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, types, exclude, extends, include

### Community 12 - "Community 12"
Cohesion: 0.29
Nodes (7): AbortSignal, EventSource, EventTarget, MessagePort, ServiceWorkerGlobalScope, WebSocket, WorkerGlobalScope

### Community 13 - "Community 13"
Cohesion: 0.29
Nodes (7): CompressionStream, DecompressionStream, FixedLengthStream, IdentityTransformStream, TextDecoderStream, TextEncoderStream, TransformStream

### Community 14 - "Community 14"
Cohesion: 0.40
Nodes (4): Cambios, Commits, Pendiente, Sesión 2026-07-09

### Community 16 - "Community 16"
Cohesion: 0.67
Nodes (3): BasicImageTransformations, RequestInitCfPropertiesImage, RequestInitCfPropertiesImageDraw

### Community 17 - "Community 17"
Cohesion: 0.67
Nodes (3): Body, Request, Response

### Community 18 - "Community 18"
Cohesion: 0.67
Nodes (3): ByteLengthQueuingStrategy, CountQueuingStrategy, QueuingStrategy

### Community 19 - "Community 19"
Cohesion: 0.67
Nodes (3): RequestInitCfPropertiesVaryAcceptHeader, RequestInitCfPropertiesVaryAcceptLanguageHeader, RequestInitCfPropertiesVaryHeader

## Knowledge Gaps
- **1051 isolated node(s):** `name`, `type`, `version`, `dev`, `build` (+1046 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `drizzle-orm` connect `Community 3` to `Community 1`?**
  _High betweenness centrality (0.003) - this node is a cross-community bridge._
- **Why does `../layouts/BaseLayout.astro` connect `Community 2` to `Community 1`?**
  _High betweenness centrality (0.002) - this node is a cross-community bridge._
- **What connects `name`, `type`, `version` to the rest of the system?**
  _1051 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.002098635886673662 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.09200603318250378 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06612685560053981 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._