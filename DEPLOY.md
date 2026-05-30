# 🚀 DEPLOY A-Z — Daily Freelance Hunter

Tiempo total: **~45-60 min**. Orden exacto. No te saltes pasos.

---

## BLOQUE 0 — Cuentas y claves (10 min)
Crea/ten a mano:
- [ ] **Supabase** (supabase.com) — gratis
- [ ] **Vercel** (vercel.com) — gratis, conecta tu GitHub
- [ ] **Anthropic** (console.anthropic.com) → API key `sk-ant-...` + saldo
- [ ] **Adzuna** (developer.adzuna.com) → `app_id` + `app_key` (gratis)
- [ ] **n8n**: o n8n Cloud (n8n.io, prueba) o self-host (Docker, abajo)
- [ ] **Gmail App Password** (si envías por Gmail): myaccount.google.com → Seguridad → Verificación 2 pasos → Contraseñas de aplicaciones

---

## BLOQUE 1 — Supabase (8 min)
1. New project → nombre `freelance-hunter` → región EU (Frankfurt) → genera password.
2. **SQL Editor** → New query → pega TODO `webapp/supabase/schema.sql` → **Run**.
   - (Si ya tenías la tabla, ejecuta además `migration_feedback.sql` y `migration_premium.sql`.)
3. **Project Settings → API** → copia:
   - `Project URL`  → será `SUPABASE_URL`
   - `service_role` `secret` → será `SUPABASE_SERVICE_ROLE_KEY`  ⚠️ secreta, solo backend.

---

## BLOQUE 2 — n8n (15 min)

### Opción A — Self-host con Docker (recomendado)
Crea `docker-compose.yml`:
```yaml
services:
  n8n:
    image: docker.n8n.io/n8nio/n8n
    restart: always
    ports: ["5678:5678"]
    environment:
      - N8N_HOST=localhost
      - N8N_PORT=5678
      - N8N_BLOCK_ENV_ACCESS_IN_NODE=false   # CLAVE: permite leer $env en Code nodes
      - ANTHROPIC_API_KEY=sk-ant-xxxxx
      - ADZUNA_APP_ID=xxxxx
      - ADZUNA_APP_KEY=xxxxx
      - SUPABASE_URL=https://xxxx.supabase.co
      - SUPABASE_SERVICE_ROLE_KEY=eyJ...
      - GENERIC_TIMEZONE=Europe/Madrid
      - TZ=Europe/Madrid
    volumes:
      - n8n_data:/home/node/.n8n
volumes:
  n8n_data:
```
```bash
docker compose up -d      # abre http://localhost:5678
```

### Importar y configurar
1. n8n → **Workflows → Import from File** → `agent/daily_freelance_hunter.n8n.json`.
2. Nodo **2. AI Score + Draft** → confirma `MODEL_SCORE` y `MODEL_DRAFT` = IDs vigentes en tu consola Anthropic.
3. Nodos **5. Send General** y **7. Send Fresh News** → crea credencial **SMTP**:
   - Gmail: host `smtp.gmail.com`, port `465`, SSL, user=tu Gmail, pass=**App Password**.
   - Outlook: host `smtp-mail.outlook.com`, port `587`, STARTTLS.
   - Asigna esa credencial a **ambos** nodos Send.
4. **Execute Workflow** (run manual) → revisa que llegan **2 correos** a `aguirre_coslada@hotmail.com`.
5. Si OK → botón **Active** (arriba dcha). Ya corre a las 08:30 y envía hacia las 09:00.

---

## BLOQUE 3 — Vercel / Web App (12 min)
1. vercel.com → **Add New → Project** → importa `jorgeaguirre150-source/Freelance-Project-Jorge`.
2. **Root Directory** → `webapp`  ⚠️ imprescindible.
3. **Environment Variables** (Settings) → añade:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ACCESS_PASSWORD`  (la contraseña para entrar al dashboard)
4. **Deploy**. Tu dashboard: `https://<tu-app>.vercel.app`
5. Entra → login con `ACCESS_PASSWORD` → verás 2 pestañas: **🏆 Empresas TOP** y **Todas**.

---

## BLOQUE 4 — Verificación end-to-end (5 min)
- [ ] En n8n, run manual sin errores (mira los logs de cada nodo).
- [ ] Llegan los 2 emails (General + 🏆 Fresh News).
- [ ] En Supabase → Table Editor → `jobs` tiene filas con `score`, `premium`.
- [ ] El dashboard `/` muestra ofertas; `/top` muestra las premium.
- [ ] Votas 👍/👎 en una oferta → al día siguiente el ranking se ajusta.

---

## BLOQUE 5 — Operación diaria (2 min/día)
1. **09:00** → llegan los 2 correos. Mira primero **🏆 Fresh News**.
2. Abre el dashboard → pestaña **TOP** → aplica 1-clic en las mejores.
3. Vota 👍/👎 para entrenar al agente.
4. Cambia el estado (`applied → interview → won`) según avances.

---

## Troubleshooting
| Síntoma | Causa / fix |
|---------|-------------|
| Code node: "env not allowed" | Falta `N8N_BLOCK_ENV_ACCESS_IN_NODE=false` |
| 0 ofertas premium | Revisa tokens ATS en `code_1_ingest.js` (array `PREMIUM`) |
| Email no llega | Credencial SMTP mal / usa App Password, no la normal |
| Dashboard vacío | Env vars de Supabase en Vercel / ejecuta el workflow primero |
| Error de modelo Anthropic | Actualiza `MODEL_SCORE`/`MODEL_DRAFT` al ID vigente |

---

## Coste mensual estimado
| Servicio | Coste |
|----------|-------|
| Supabase | 0 € (free tier) |
| Vercel | 0 € (hobby) |
| n8n self-host | 0 € (tu máquina/VPS) |
| Claude (Haiku+Sonnet) | ~5-12 €/mes |
| **TOTAL** | **~5-12 €/mes** |
