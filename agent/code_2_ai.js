// NODO 2 — AI Score (Haiku, por lotes) + Draft (Sonnet, top) (mode: Run Once for All Items)
// Escala a cientos de ofertas. Devuelve TODAS las relevantes (>=65) + borradores para el top 12.

const KEY  = $env.ANTHROPIC_API_KEY;
const http = (opts) => this.helpers.httpRequest(opts);

// Verifica que sean los model IDs vigentes en tu cuenta Anthropic.
const MODEL_SCORE = 'claude-haiku-4-5';
const MODEL_DRAFT = 'claude-sonnet-4-5';

const THRESHOLD   = 65;   // match minimo para notificar
const DRAFT_TOP   = 12;   // cuantos borradores genera (coste)
const MAX_SCORE   = 200;  // tope de ofertas a puntuar/dia
const CHUNK       = 50;   // tamano de lote de scoring

// --- Perfil de Jorge (CV 2026) ---
const PROFILE = `Jorge Aguirre Romero — Senior Cloud & AI Platform Architect (Madrid, remote, EU/US, open to relocation).
15 years international IT, 5+ years enterprise cloud architecture.
NOW: co-owner of Mercedes-Benz mAzure HUB (multi-region Azure hub-and-spoke, EMEA/APAC/NAFTA); principal architect of "Minerva", their NVIDIA AI factory.
CORE: Azure, AWS (GCP/Oracle exposure); Terraform/Terragrunt; GitLab CI/CD; multi-tenant Kubernetes AKS/EKS (vCluster-style isolation); GPU platforms (NVIDIA NGC/CUDA, GPU Operator, device plugin); hybrid networking (ExpressRoute, hub-spoke, NVA NAT, DNS, peering); observability (Grafana, Prometheus, Langfuse/Phoenix).
AI: Agentic systems & multi-agent RAG (LangChain/LangGraph, LlamaIndex, Anthropic SDK), guardrails, evals.
REGULATED: Automotive (Mercedes), Pharma (GxP, ICH E6, 21 CFR Part 11), Healthcare (HIPAA), Banking (BBVA).
PROOF: 30% AWS cost cut via IaC. Languages: ES native, EN C1, DE A2.
RATE: day-rate floor 295 EUR + VAT; target 450-600 EUR/day. Prefer contract/freelance, remote, that meet/exceed the floor OR don't disclose rate. Penalize on-site-only, junior, or stack-unrelated roles.`;

const items = $input.all().map(i=>i.json);
if(!KEY){ throw new Error('Falta ANTHROPIC_API_KEY en variables de entorno de n8n'); }
if(items.length===0){ return [{ json:{ total:0, shortlist:[], more:[] } }]; }

async function anthropic(model, system, user, maxTokens){
  const r = await http({ method:'POST', url:'https://api.anthropic.com/v1/messages', json:true,
    headers:{ 'x-api-key':KEY, 'anthropic-version':'2023-06-01', 'content-type':'application/json' },
    body:{ model, max_tokens:maxTokens, system, messages:[{ role:'user', content:user }] } });
  return r.content[0].text;
}
const parseArr = (txt)=>{ const m = txt.match(/\[[\s\S]*\]/); return m ? JSON.parse(m[0]) : []; };

// ---- 1) SCORING por lotes (Haiku) ----
const pool = items.slice(0, MAX_SCORE);
const scoreSys = `You score how well freelance/contract jobs match a candidate. Return ONLY a JSON array, no prose. `+
`Each: {"i":<index>,"score":<0-100>,"reason":"<max 12 words>"}. `+
`High = senior cloud/platform/devops/SRE/AI-infra/GPU, remote or EU/US, contract-friendly, rate >= floor or undisclosed. `+
`Low = junior, on-site only, unrelated stack, or rate clearly below floor.`;

let allScores = [];
for(let start=0; start<pool.length; start+=CHUNK){
  const batch = pool.slice(start, start+CHUNK).map((j,k)=>({ i:start+k, title:j.title, company:j.company,
    location:j.location, salary:j.salary, desc:(j.description||'').slice(0,400) }));
  const user = `PROFILE:\n${PROFILE}\n\nJOBS (JSON):\n${JSON.stringify(batch)}\n\nReturn the JSON array of scores.`;
  try { allScores = allScores.concat(parseArr(await anthropic(MODEL_SCORE, scoreSys, user, 3000))); }
  catch(e){ console.log('score batch fail @'+start+':', e.message);
    allScores = allScores.concat(batch.map(b=>({ i:b.i, score:50, reason:'fallback' }))); }
}

let scored = pool.map((j,idx)=>{ const s = allScores.find(x=>x.i===idx) || { score:0, reason:'' };
  return { ...j, score:s.score, reason:s.reason }; });

let relevant = scored.filter(j=>j.score>=THRESHOLD).sort((a,b)=>b.score-a.score);
if(relevant.length===0){ relevant = scored.sort((a,b)=>b.score-a.score).slice(0,8); } // relax si 0

const shortlist = relevant.slice(0, DRAFT_TOP);
const more = relevant.slice(DRAFT_TOP);

// ---- 2) DRAFTS (Sonnet, solo top) ----
const draftSys = `You write short freelance proposals (max 90 words each). Confident, specific, one quantified proof, `+
`end with one question. Real proof: co-owner of Mercedes-Benz mAzure HUB, 30% AWS cost cut, principal architect of NVIDIA AI factory. `+
`Match the job's language (Spanish job -> Spanish draft). Return ONLY a JSON array: [{"i":<index>,"draft":"..."}].`;
const draftInput = shortlist.map((j,idx)=>({ i:idx, title:j.title, company:j.company, desc:(j.description||'').slice(0,450) }));
let drafts = [];
if(shortlist.length){
  const user = `PROFILE:\n${PROFILE}\n\nJOBS:\n${JSON.stringify(draftInput)}\n\nReturn the JSON array of drafts.`;
  try { drafts = parseArr(await anthropic(MODEL_DRAFT, draftSys, user, 4000)); }
  catch(e){ console.log('draft fail:', e.message); }
}
const finalShort = shortlist.map((j,idx)=>({ ...j, draft:(drafts.find(d=>d.i===idx)||{}).draft || '(borrador no generado — redactar manualmente)' }));

console.log(`Relevantes: ${relevant.length} | con borrador: ${finalShort.length} | resto: ${more.length}`);
return [{ json:{ total:relevant.length, shortlist:finalShort, more } }];
