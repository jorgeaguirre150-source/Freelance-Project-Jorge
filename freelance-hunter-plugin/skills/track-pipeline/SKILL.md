---
name: track-pipeline
description: Manages the freelance client-acquisition pipeline — application statuses, follow-ups, and weekly KPIs. Use when the user says "pipeline", "seguimiento", "estado de candidaturas", "follow up", "qué tengo pendiente", "KPIs de la semana", "actualiza estado". Reads/updates the pipeline (Supabase if connected, otherwise a local tracker) and proposes next actions.
---

# Track Pipeline

Keep the acquisition pipeline moving and surface what needs action.

## Stages
`new → applied → interview → won → rejected`

## Steps
1. **Read the pipeline.** If Supabase is configured, query the `jobs` table; otherwise maintain a Markdown/CSV tracker the user points to.
2. **Surface what needs action:**
   - Applied with no reply in 4–5 days → propose a follow-up message.
   - Interview scheduled → prep notes + (if Calendar connected) confirm slot.
   - Won → checklist: contract, NDA, rate confirmed, kickoff.
3. **Weekly KPIs:** applications sent, response rate, interviews, win rate, blended day-rate. Compare vs target (blended 295 → 450 in 90 days).
4. **Next actions:** list the top 3 moves for today (apply to N fresh top matches, send M follow-ups, X outreach).

## Rules
- Velocity wins: prioritize applying to fresh top matches within the first hour.
- Never send messages automatically — draft and let the human approve.
- Feed outcomes back: 👍/👎 on offers tunes `find-clients` scoring over time.
