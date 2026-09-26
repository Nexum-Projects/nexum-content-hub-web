# Username slug en el CMS — plan

**Versión:** `v1.0`  
**Fecha:** 2026-09-13  
**Ambiente:** nexum-content-hub-front, rama `feat/username-slug`  
**API:** `content-hub-api@feat/username-slug`

**Goal:** Registro y alta/edición de usuarios piden un username slug,
no “María López”.

**Architecture:** Zod compartido en `lib/username.ts`. El JSON sigue
siendo `name`. Sin firstName/lastName.

## Constraints

- Misma regex que el API: `^[a-z][a-z0-9_]{2,31}$`.
- No inventar campos nuevos.
- Usuarios viejos con espacios: el edit bloquea hasta corregir el slug.
