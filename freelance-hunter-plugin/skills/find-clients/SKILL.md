---
name: find-clients
description: Finds and scores the best freelance/contract opportunities and elite-company roles for a senior Cloud & AI Platform architect, in Europe and worldwide. Use when the user says "buscar clientes freelance", "find freelance clients", "oportunidades de hoy", "qué hay hoy", "best contracts", "scan jobs", "freelance leads". Returns a ranked shortlist (match >= 78) plus top-company roles, with day-rate fit (floor 295 EUR + VAT), and proposal-ready context.
---

# Find Clients

Surface only the BEST freelance/contract opportunities and elite-company roles for the candidate. Quality over quantity.

## Steps

1. **Load the profile** from `references/profile.md` (candidate skills, elite companies, scoring rubric, day-rate floor, sources). Treat it as ground truth for matching.
2. **Gather opportunities.** Prefer, in order:
   - If the n8n agent is running, read today's results from Supabase / the daily email (already scored).
   - Otherwise, use connected tools (Gmail for Malt/Upwork/LinkedIn alerts) and/or WebSearch over the sources listed in `references/profile.md`.
3. **Score each** 0–100 against the rubric. Surface only **score ≥ 78** for the general list. Always include elite-company roles (from the 16 in the profile) regardless of threshold, marked 🏆.
4. **Rank and present** a compact shortlist: source · match · title · company · location · rate (if any) · 1-line reason · link. Put 🏆 elite companies first.
5. **Flag rate fit:** mark anything below the 295 EUR/day floor; never recommend underpriced work.
6. For the top picks, offer to run **`write-proposal`** next.

## Rules
- Both freelance AND strong permanent roles at elite companies count — score both highly when quality is high. Penalize junior, on-site-only, low-budget, generic staffing.
- Decide proposal language later by region (ES for Spain/LatAm, EN otherwise).
- Never apply or send anything automatically — surface, the human decides.

## Automation
The recurring engine is the n8n workflow in `references/daily_freelance_hunter.n8n.json` (runs 08:30, emails 2 reports ~09:00). Setup in `references/automation-setup.md`.
