# Freelance Hunter — Web App (Dashboard)

Dashboard privado que muestra las ofertas que el agente n8n guarda en Supabase: filtrar por match/estado, ver/editar el borrador de propuesta, aplicar con 1 clic (abre la oferta + marca estado) y llevar el pipeline (new → applied → interview → won).

## Stack
Next.js 14 (App Router) · Supabase (Postgres) · Tailwind · Deploy en Vercel.

## Arquitectura

```
Agente n8n  --upsert-->  Supabase (tabla jobs)  <--lee--  Web App (Next.js)
                                                          login + dashboard + acciones
```

## Setup

### 1. Supabase
1. Crea un proyecto en supabase.com.
2. SQL Editor → pega y ejecuta `supabase/schema.sql`.
3. Project Settings → API → copia `Project URL` y `service_role` key.

### 2. Variables de entorno
Copia `.env.example` a `.env.local` y rellena:
```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
ACCESS_PASSWORD=tu-contrasena
```
> La `service_role` key es secreta y solo se usa en el servidor. Nunca la pongas en código cliente.

### 3. Local
```bash
npm install
npm run dev      # http://localhost:3000  (login con ACCESS_PASSWORD)
```

### 4. Deploy en Vercel
1. Importa el repo en Vercel.
2. **Root Directory = `webapp`**.
3. Añade las 3 env vars (Settings → Environment Variables).
4. Deploy. Tu dashboard queda en `https://<tu-app>.vercel.app`.

### 5. Conectar el agente n8n
En el host de n8n añade las mismas envs de Supabase:
```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```
El nodo **3. Upsert Supabase** del workflow ya escribe ahí cada mañana.

## Funciones
- **Filtros**: por estado (new/applied/interview/won/rejected) y umbral de match.
- **Aplicar 1-clic**: abre la oferta en pestaña nueva y marca `applied`.
- **Borrador**: ver, editar, guardar y copiar al portapapeles.
- **Pipeline**: cambia el estado desde el desplegable de cada tarjeta.
- **Auth**: login simple por contraseña (cookie httpOnly), pensado para 1 usuario.

## Roadmap (siguientes fases)
- Analytics: ratio de respuesta por fuente, embudo del pipeline.
- Adjuntar el CV automáticamente al aplicar / generar email de aplicación.
- Semi-auto apply donde sea legal (email-apply, APIs ATS Lever/Greenhouse).
- Parsing de alertas de LinkedIn/Malt/Upwork desde un Gmail dedicado.
