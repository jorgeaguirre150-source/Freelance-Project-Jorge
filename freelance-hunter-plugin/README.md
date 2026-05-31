# Freelance Hunter — Cowork Plugin

Tu sistema de captación de clientes freelance Cloud/AI, empaquetado como plugin. Tú eres el dueño del agente; el plugin lo opera.

## Para quién
Senior Cloud & AI Platform Architect (Azure/AWS · Terraform · Kubernetes · GPU/NVIDIA · Agentic AI · entornos regulados). Tarifa floor **295 €/día + IVA** (objetivo 450–800).

## Qué hace (skills)
| Skill | Invocas con | Qué hace |
|-------|-------------|----------|
| **find-clients** | `/find-clients` · "buscar clientes freelance" | Busca y puntúa las mejores oportunidades freelance + empresas élite (match ≥ 78) |
| **write-proposal** | `/write-proposal` · "redacta propuesta" | Redacta una propuesta a medida en ES/EN según la región de la oferta |
| **track-pipeline** | `/track-pipeline` · "pipeline" | Gestiona estados, follow-ups y KPIs semanales |

## Automatización incluida
- `skills/find-clients/references/daily_freelance_hunter.n8n.json` — workflow n8n que cada mañana (08:30) busca en 7 fuentes globales + 16 empresas élite, puntúa con IA y envía 2 reportes (general + 🏆 Fresh News) a las 09:00.
- Dashboard Next.js + Supabase (en el repo `Freelance-Project-Jorge`).

## Conectores recomendados (se conectan en Cowork → Ajustes → Conectores)
- **Gmail** — leer alertas de Malt/Upwork/LinkedIn y enviar outreach.
- **Calendar** — agendar discovery calls.
- (El agente n8n ya envía los reportes vía Gmail SMTP de forma independiente.)

## Instalación
Acepta el archivo `freelance-hunter.plugin`. Las skills aparecen en tu menú `/`.
