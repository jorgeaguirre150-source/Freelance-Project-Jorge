// NODO 1 — Ingest GLOBAL + Normalize + Dedup  (mode: Run Once for All Items)
// 7 fuentes legales (APIs/feeds). Prefiltro por sector. Dedup entre dias (workflowStaticData, 30d).

const http = (opts) => this.helpers.httpRequest(opts);
const staticData = this.getWorkflowStaticData('global');

// --- Sector de Jorge (CV 2026) ---
const KEYWORDS = ['cloud architect','cloud engineer','platform engineer','platform architect',
  'devops','sre','site reliability','terraform','terragrunt','kubernetes','aks','eks',
  'aws','azure','gcp','mlops','llmops','ai infrastructure','ai platform','gpu','nvidia',
  'infrastructure as code','solutions architect','agentic','rag'];

const ADZUNA_ID  = $env.ADZUNA_APP_ID  || '';
const ADZUNA_KEY = $env.ADZUNA_APP_KEY || '';
// "todo el mundo": Adzuna cubre estos paises (1 call c/u). Recorta si quieres menos volumen.
const ADZUNA_COUNTRIES = ['gb','de','fr','es','nl','it','at','ch','pl','us','ca','au','in','sg'];

async function safe(name, fn){ try { const r = await fn(); console.log(`${name}: ${r.length}`); return r; }
  catch(e){ console.log(`${name} ERROR:`, e.message); return []; } }
const strip = (s)=> (s||'').toString().replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,1000);

let jobs = [];

// 1) Remotive
jobs = jobs.concat(await safe('Remotive', async()=>{
  const r = await http({ url:'https://remotive.com/api/remote-jobs?search=cloud', json:true });
  return (r.jobs||[]).map(j=>({ source:'Remotive', title:j.title, company:j.company_name,
    location:j.candidate_required_location||'Remote', url:j.url, description:strip(j.description), salary:j.salary||'' }));
}));

// 2) RemoteOK
jobs = jobs.concat(await safe('RemoteOK', async()=>{
  const r = await http({ url:'https://remoteok.com/api', json:true, headers:{'User-Agent':'DailyFreelanceHunter/1.0'} });
  return (Array.isArray(r)?r.slice(1):[]).map(j=>({ source:'RemoteOK', title:j.position||j.title, company:j.company,
    location:j.location||'Remote', url:j.url, description:strip(j.description), salary:'' }));
}));

// 3) Arbeitnow (EU)
jobs = jobs.concat(await safe('Arbeitnow', async()=>{
  const r = await http({ url:'https://www.arbeitnow.com/api/job-board-api', json:true });
  return (r.data||[]).map(j=>({ source:'Arbeitnow', title:j.title, company:j.company_name,
    location:j.location||'Remote', url:j.url, description:strip(j.description), salary:'' }));
}));

// 4) Jobicy (remoto global)
jobs = jobs.concat(await safe('Jobicy', async()=>{
  const r = await http({ url:'https://jobicy.com/api/v2/remote-jobs?count=50&tag=devops', json:true });
  return (r.jobs||[]).map(j=>({ source:'Jobicy', title:j.jobTitle, company:j.companyName,
    location:j.jobGeo||'Remote', url:j.url, description:strip(j.jobExcerpt), salary:'' }));
}));

// 5) Himalayas (remoto global)
jobs = jobs.concat(await safe('Himalayas', async()=>{
  const r = await http({ url:'https://himalayas.app/jobs/api?limit=50', json:true });
  return (r.jobs||[]).map(j=>({ source:'Himalayas', title:j.title, company:j.companyName,
    location:(j.locationRestrictions&&j.locationRestrictions.join(', '))||'Remote',
    url:j.applicationLink||j.url||('https://himalayas.app/jobs/'+(j.slug||'')), description:strip(j.description||j.excerpt), salary:'' }));
}));

// 6) The Muse (global, tech categories)
jobs = jobs.concat(await safe('TheMuse', async()=>{
  const r = await http({ url:'https://www.themuse.com/api/public/jobs?category=Data%20and%20Analytics&category=Engineering&page=1', json:true });
  return (r.results||[]).map(j=>({ source:'TheMuse', title:j.name, company:(j.company&&j.company.name)||'',
    location:(j.locations&&j.locations.map(l=>l.name).join(', '))||'', url:(j.refs&&j.refs.landing_page)||'', description:strip(j.contents), salary:'' }));
}));

// 7) Adzuna (agregador multi-pais, requiere key)
if(ADZUNA_ID && ADZUNA_KEY){
  for(const c of ADZUNA_COUNTRIES){
    jobs = jobs.concat(await safe('Adzuna-'+c, async()=>{
      const r = await http({ url:`https://api.adzuna.com/v1/api/jobs/${c}/search/1`,
        qs:{ app_id:ADZUNA_ID, app_key:ADZUNA_KEY, what_or:'cloud architect terraform kubernetes devops platform sre',
             results_per_page:30, 'content-type':'application/json' }, json:true });
      return (r.results||[]).map(j=>({ source:'Adzuna-'+c.toUpperCase(), title:j.title,
        company:(j.company&&j.company.display_name)||'', location:(j.location&&j.location.display_name)||'',
        url:j.redirect_url, description:strip(j.description),
        salary:j.salary_min?`${Math.round(j.salary_min)}-${Math.round(j.salary_max)}`:'' }));
    }));
  }
}

// --- PREMIUM: 10 empresas TOP del sector (ATS oficiales) — freelance O fijo ---
// Edita token si alguna empresa cambia de ATS. Todas envueltas en safe() => si una falla, sigue.
const PREMIUM = [
  { name:'Anthropic',    provider:'greenhouse', token:'anthropic' },
  { name:'Databricks',   provider:'greenhouse', token:'databricks' },
  { name:'HashiCorp',    provider:'greenhouse', token:'hashicorp' },
  { name:'Hugging Face', provider:'greenhouse', token:'huggingface' },
  { name:'GitLab',       provider:'greenhouse', token:'gitlab' },
  { name:'Elastic',      provider:'greenhouse', token:'elastic' },
  { name:'Canonical',    provider:'greenhouse', token:'canonical' },
  { name:'OpenAI',       provider:'ashby',      token:'openai' },
  { name:'Cohere',       provider:'ashby',      token:'cohere' },
  { name:'Scale AI',     provider:'lever',      token:'scaleai' },
];
async function fetchATS(c){
  if(c.provider==='greenhouse'){
    const r = await http({ url:`https://boards-api.greenhouse.io/v1/boards/${c.token}/jobs?content=true`, json:true });
    return (r.jobs||[]).map(j=>({ source:'🏆 '+c.name, premium:true, title:j.title, company:c.name,
      location:(j.location&&j.location.name)||'', url:j.absolute_url, description:strip(j.content), salary:'' }));
  }
  if(c.provider==='lever'){
    const r = await http({ url:`https://api.lever.co/v0/postings/${c.token}?mode=json`, json:true });
    return (Array.isArray(r)?r:[]).map(j=>({ source:'🏆 '+c.name, premium:true, title:j.text, company:c.name,
      location:(j.categories&&j.categories.location)||'', url:j.hostedUrl, description:strip(j.descriptionPlain||j.description), salary:'' }));
  }
  if(c.provider==='ashby'){
    const r = await http({ url:`https://api.ashbyhq.com/posting-api/job-board/${c.token}`, json:true });
    return (r.jobs||[]).map(j=>({ source:'🏆 '+c.name, premium:true, title:j.title, company:c.name,
      location:j.location||'', url:j.jobUrl||j.applyUrl, description:strip(j.descriptionPlain||j.description), salary:'' }));
  }
  return [];
}
for(const c of PREMIUM){ jobs = jobs.concat(await safe('Premium:'+c.name, ()=>fetchATS(c))); }

// Prefiltro por sector (barato, antes de gastar tokens) — aplica a todas (incl. premium en tu sector)
jobs = jobs.filter(j=>{ const t=((j.title||'')+' '+(j.description||'')).toLowerCase();
  return KEYWORDS.some(k=>t.includes(k)); });

// Dedup en el run + entre dias (caduca 30d)
staticData.seen = staticData.seen || {};
const now = Date.now();
for(const k in staticData.seen){ if(now - staticData.seen[k] > 2592000000) delete staticData.seen[k]; }

const within = new Set(); const out = [];
for(const j of jobs){
  if(!j.title) continue;
  const key = ((j.url||'') || ((j.title||'')+'|'+(j.company||''))).toLowerCase().trim();
  if(!key || within.has(key) || staticData.seen[key]) continue;
  within.add(key); staticData.seen[key] = now;
  out.push(j);
}

console.log(`TOTAL nuevas tras dedup: ${out.length}`);
return out.map(j=>({ json:j }));
