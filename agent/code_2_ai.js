// NODO 2 — AI Score (Haiku, por lotes) + Draft (Sonnet) + Calibracion + Premium
// Devuelve: premium (empresas top, freelance O fijo), shortlist (resto con borrador), more (tabla).

const KEY  = $env.ANTHROPIC_API_KEY;
const http = (opts) => this.helpers.httpRequest(opts);

const MODEL_SCORE = 'claude-haiku-4-5';   // verifica IDs vigentes en tu cuenta
const MODEL_DRAFT = 'claude-sonnet-4-5';

const THRESHOLD = 65;   // match minimo para notificar (no aplica a premium)
const DRAFT_TOP = 10;   // borradores para el resto (no-premium)
const PREM_TOP  = 15;   // cuantas premium mostrar
const PREM_DRAFT= 6;    // borradores para premium
const MAX_SCORE = 220;
const CHUNK     = 50;

const PROFILE = `Jorge Aguirre Romero — Senior Cloud & AI Platform Architect (Madrid, remote, EU/US, open to relocation).
15 years international IT, 5+ years enterprise cloud architecture.
NOW: co-owner of Mercedes-Benz mAzure HUB; principal architect of "Minerva", their NVIDIA AI factory.
CORE: Azure, AWS; Terraform/Terragrunt; GitLab CI/CD; multi-tenant Kubernetes AKS/EKS; GPU (NVIDIA NGC/CUDA, GPU Operator); hybrid networking; Grafana/Prometheus.
AI: Agentic & multi-agent RAG (LangChain/LangGraph, LlamaIndex, Anthropic SDK), guardrails, evals.
REGULATED: Automotive, Pharma (GxP/21 CFR Part 11), Healthcare (HIPAA), Banking.
PROOF: 30% AWS cost cut via IaC. Languages: ES native, EN C1, DE A2.
RATE: freelance day-rate floor 295 EUR + VAT (target 450-600). Prefer contract OR undisclosed rate.`;

const items = $input.all().map(i=>i.json);
if(!KEY){ throw new Error('Falta ANTHROPIC_API_KEY en variables de entorno de n8n'); }
if(items.length===0){ return [{ json:{ total:0, premium:[], shortlist:[], more:[] } }]; }

async function anthropic(model, system, user, maxTokens){
  const r = await http({ method:'POST', url:'https://api.anthropic.com/v1/messages', json:true,
    headers:{ 'x-api-key':KEY, 'anthropic-version':'2023-06-01', 'content-type':'application/json' },
    body:{ model, max_tokens:maxTokens, system, messages:[{ role:'user', content:user }] } });
  return r.content[0].text;
}
const parseArr = (txt)=>{ const m = txt.match(/\[[\s\S]*\]/); return m ? JSON.parse(m[0]) : []; };

// ---- CALIBRACION: aprende tu gusto (feedback 👍/👎) ----
const SB_URL = $env.SUPABASE_URL;
const SB_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;
async function fbExamples(v){
  if(!SB_URL || !SB_KEY) return [];
  try{
    const r = await http({ url:`${SB_URL}/rest/v1/jobs?feedback=eq.${v}&select=title,company,location&order=created_at.desc&limit=12`,
      headers:{ apikey:SB_KEY, Authorization:`Bearer ${SB_KEY}` }, json:true });
    return Array.isArray(r) ? r : [];
  }catch(e){ console.log('feedback fetch fail:', e.message); return []; }
}
const liked = await fbExamples('up');
const disliked = await fbExamples('down');
const fmt = (a)=> a.map(x=>`- ${x.title} @ ${x.company||'?'} (${x.location||'?'})`).join('\n');
const CAL = (liked.length || disliked.length)
  ? `\n\nCALIBRATION — learn from past feedback. Boost similar to LIKED, penalize similar to DISLIKED.\nLIKED:\n${fmt(liked)||'(none)'}\nDISLIKED:\n${fmt(disliked)||'(none)'}`
  : '';
console.log(`Calibracion: ${liked.length} 👍 / ${disliked.length} 👎`);

// ---- 1) SCORING por lotes (Haiku) ----
const pool = items.slice(0, MAX_SCORE);
const scoreSys = `You score how well freelance/contract jobs match a candidate. Return ONLY a JSON array, no prose. `+
`Each: {"i":<index>,"score":<0-100>,"reason":"<max 12 words>"}. `+
`High = senior cloud/platform/devops/SRE/AI-infra/GPU, remote or EU/US, contract-friendly, rate >= floor or undisclosed. `+
`Low = junior, on-site only, unrelated stack, or rate clearly below floor. `+
`IMPORTANT: jobs with "premium":true are at the candidate's TOP target companies — he accepts BOTH freelance/contract AND permanent there; give a strong boost and do NOT penalize full-time/permanent.`;

let allScores = [];
for(let start=0; start<pool.length; start+=CHUNK){
  const batch = pool.slice(start, start+CHUNK).map((j,k)=>({ i:start+k, premium:!!j.premium, title:j.title,
    company:j.company, location:j.location, salary:j.salary, desc:(j.description||'').slice(0,400) }));
  const user = `PROFILE:\n${PROFILE}${CAL}\n\nJOBS (JSON):\n${JSON.stringify(batch)}\n\nReturn the JSON array of scores.`;
  try { allScores = allScores.concat(parseArr(await anthropic(MODEL_SCORE, scoreSys, user, 3000))); }
  catch(e){ console.log('score batch fail @'+start+':', e.message);
    allScores = allScores.concat(batch.map(b=>({ i:b.i, score:b.premium?75:50, reason:'fallback' }))); }
}

const scored = pool.map((j,idx)=>{ const s = allScores.find(x=>x.i===idx) || { score:0, reason:'' };
  return { ...j, score:s.score, reason:s.reason }; });

// Premium: TODAS las de empresas top (sin umbral), por score
const premiumJobs = scored.filter(j=>j.premium).sort((a,b)=>b.score-a.score).slice(0, PREM_TOP);
// Resto: solo >= umbral
let relevant = scored.filter(j=>!j.premium && j.score>=THRESHOLD).sort((a,b)=>b.score-a.score);
if(relevant.length===0 && premiumJobs.length===0){ relevant = scored.sort((a,b)=>b.score-a.score).slice(0,8); }
const shortlist = relevant.slice(0, DRAFT_TOP);
const more = relevant.slice(DRAFT_TOP);

// ---- 2) DRAFTS (Sonnet) para premium top + shortlist (dedup por url) ----
const draftPoolRaw = [...premiumJobs.slice(0, PREM_DRAFT), ...shortlist];
const seenK = new Set(); const draftPool = [];
for(const j of draftPoolRaw){ const k=(j.url||j.title); if(seenK.has(k)) continue; seenK.add(k); draftPool.push(j); }

const draftSys = `You write short freelance/role proposals (max 90 words). Confident, specific, one quantified proof, `+
`end with one question. Real proof: co-owner of Mercedes-Benz mAzure HUB, 30% AWS cost cut, principal architect of NVIDIA AI factory. `+
`LANGUAGE RULE (decide per job by region/language): if the job is in Spain or Latin America, or its text is in Spanish, write the draft in SPANISH; otherwise write it in ENGLISH. `+
`Return ONLY a JSON array: [{"i":<index>,"draft":"..."}].`;
let drafts = [];
if(draftPool.length){
  const dInput = draftPool.map((j,idx)=>({ i:idx, title:j.title, company:j.company, location:j.location, desc:(j.description||'').slice(0,450) }));
  try { drafts = parseArr(await anthropic(MODEL_DRAFT, draftSys, `PROFILE:\n${PROFILE}\n\nJOBS:\n${JSON.stringify(dInput)}\n\nReturn the JSON array of drafts.`, 4000)); }
  catch(e){ console.log('draft fail:', e.message); }
}
const byKey = {};
draftPool.forEach((j,idx)=>{ byKey[j.url||j.title] = (drafts.find(d=>d.i===idx)||{}).draft || null; });
const attach = (j)=>({ ...j, draft: byKey[j.url||j.title] || j.draft || null });

const premiumOut = premiumJobs.map(attach);
const shortlistOut = shortlist.map(attach);

console.log(`Premium: ${premiumOut.length} | shortlist: ${shortlistOut.length} | more: ${more.length}`);
return [{ json:{ total: relevant.length + premiumJobs.length, premium: premiumOut, shortlist: shortlistOut, more } }];
