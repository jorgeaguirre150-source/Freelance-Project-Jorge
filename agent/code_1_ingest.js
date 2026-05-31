// NODO 1 — Ingest GLOBAL + Normalize + Dedup  (mode: Run Once for All Items)
// ANTI-BLOQUEO: solo APIs/feeds oficiales (sin scraping). User-Agent correcto,
// pausas entre llamadas (rate-limit friendly), reintentos con backoff y timeouts.

const httpRaw = (opts) => this.helpers.httpRequest(opts);
const staticData = this.getWorkflowStaticData('global');

const UA = 'Mozilla/5.0 (compatible; FreelanceHunter/1.0; cloud-jobs-aggregator)';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Petición educada: UA + Accept + timeout + reintentos con backoff (mas si 429)
async function req(opts, tries = 3){
  for(let a = 1; a <= tries; a++){
    try{
      return await httpRaw({ timeout: 15000, ...opts,
        headers: { 'User-Agent': UA, 'Accept': 'application/json', ...(opts.headers || {}) } });
    }catch(e){
      const code = e.statusCode || e.httpCode || (e.response && e.response.status) || 0;
      if(a === tries) throw e;
      const wait = (code === 429 || code === 503) ? 5000 * a : 1500 * a; // backoff
      console.log(`retry ${a}/${tries} (${code||'err'}) esperando ${wait}ms`);
      await sleep(wait);
    }
  }
}

// safe + pausa cortés tras cada fuente (evita ráfagas)
async function safe(name, fn){
  try { const r = await fn(); console.log(`${name}: ${r.length}`); await sleep(400); return r; }
  catch(e){ console.log(`${name} ERROR:`, e.message); await sleep(400); return []; }
}
const strip = (s)=> (s||'').toString().replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,1000);

const KEYWORDS = ['cloud architect','cloud engineer','platform engineer','platform architect',
  'devops','sre','site reliability','terraform','terragrunt','kubernetes','aks','eks',
  'aws','azure','gcp','mlops','llmops','ai infrastructure','ai platform','gpu','nvidia',
  'infrastructure as code','solutions architect','agentic','rag'];

const ADZUNA_ID  = $env.ADZUNA_APP_ID  || '';
const ADZUNA_KEY = $env.ADZUNA_APP_KEY || '';
const ADZUNA_COUNTRIES = ['gb','de','fr','es','nl','it','at','ch','pl','us','ca','au','in','sg'];

let jobs = [];

// 1) Remotive
jobs = jobs.concat(await safe('Remotive', async()=>{
  const r = await req({ url:'https://remotive.com/api/remote-jobs?search=cloud', json:true });
  return (r.jobs||[]).map(j=>({ source:'Remotive', title:j.title, company:j.company_name,
    location:j.candidate_required_location||'Remote', url:j.url, description:strip(j.description), salary:j.salary||'' }));
}));

// 2) RemoteOK
jobs = jobs.concat(await safe('RemoteOK', async()=>{
  const r = await req({ url:'https://remoteok.com/api', json:true });
  return (Array.isArray(r)?r.slice(1):[]).map(j=>({ source:'RemoteOK', title:j.position||j.title, company:j.company,
    location:j.location||'Remote', url:j.url, description:strip(j.description), salary:'' }));
}));

// 3) Arbeitnow (EU)
jobs = jobs.concat(await safe('Arbeitnow', async()=>{
  const r = await req({ url:'https://www.arbeitnow.com/api/job-board-api', json:true });
  return (r.data||[]).map(j=>({ source:'Arbeitnow', title:j.title, company:j.company_name,
    location:j.location||'Remote', url:j.url, description:strip(j.description), salary:'' }));
}));

// 4) Jobicy
jobs = jobs.concat(await safe('Jobicy', async()=>{
  const r = await req({ url:'https://jobicy.com/api/v2/remote-jobs?count=50&tag=devops', json:true });
  return (r.jobs||[]).map(j=>({ source:'Jobicy', title:j.jobTitle, company:j.companyName,
    location:j.jobGeo||'Remote', url:j.url, description:strip(j.jobExcerpt), salary:'' }));
}));

// 5) Himalayas
jobs = jobs.concat(await safe('Himalayas', async()=>{
  const r = await req({ url:'https://himalayas.app/jobs/api?limit=50', json:true });
  return (r.jobs||[]).map(j=>({ source:'Himalayas', title:j.title, company:j.companyName,
    location:(j.locationRestrictions&&j.locationRestrictions.join(', '))||'Remote',
    url:j.applicationLink||j.url||('https://himalayas.app/jobs/'+(j.slug||'')), description:strip(j.description||j.excerpt), salary:'' }));
}));

// 6) The Muse
jobs = jobs.concat(await safe('TheMuse', async()=>{
  const r = await req({ url:'https://www.themuse.com/api/public/jobs?category=Data%20and%20Analytics&category=Engineering&page=1', json:true });
  return (r.results||[]).map(j=>({ source:'TheMuse', title:j.name, company:(j.company&&j.company.name)||'',
    location:(j.locations&&j.locations.map(l=>l.name).join(', '))||'', url:(j.refs&&j.refs.landing_page)||'', description:strip(j.contents), salary:'' }));
}));

// 7) Adzuna (multi-pais) — pausa entre paises para respetar rate-limit
if(ADZUNA_ID && ADZUNA_KEY){
  for(const c of ADZUNA_COUNTRIES){
    jobs = jobs.concat(await safe('Adzuna-'+c, async()=>{
      const r = await req({ url:`https://api.adzuna.com/v1/api/jobs/${c}/search/1`,
        qs:{ app_id:ADZUNA_ID, app_key:ADZUNA_KEY, what_or:'cloud architect terraform kubernetes devops platform sre',
             results_per_page:30, 'content-type':'application/json' }, json:true });
      return (r.results||[]).map(j=>({ source:'Adzuna-'+c.toUpperCase(), title:j.title,
        company:(j.company&&j.company.display_name)||'', location:(j.location&&j.location.display_name)||'',
        url:j.redirect_url, description:strip(j.description),
        salary:j.salary_min?`${Math.round(j.salary_min)}-${Math.round(j.salary_max)}`:'' }));
    }));
    await sleep(600); // < 25 req/min de Adzuna
  }
}

// --- PREMIUM: 10 empresas TOP (ATS oficiales) — freelance O fijo ---
const PREMIUM = [
  // IA / LLM labs
  { name:'Anthropic',    provider:'greenhouse', token:'anthropic' },
  { name:'OpenAI',       provider:'ashby',      token:'openai' },
  { name:'Cohere',       provider:'ashby',      token:'cohere' },
  { name:'Hugging Face', provider:'greenhouse', token:'huggingface' },
  { name:'Scale AI',     provider:'lever',      token:'scaleai' },
  // Cloud / Data / Platform de élite
  { name:'Databricks',   provider:'greenhouse', token:'databricks' },
  { name:'HashiCorp',    provider:'greenhouse', token:'hashicorp' },
  { name:'Confluent',    provider:'greenhouse', token:'confluent' },
  { name:'MongoDB',      provider:'greenhouse', token:'mongodb' },
  { name:'Datadog',      provider:'greenhouse', token:'datadog' },
  { name:'Elastic',      provider:'greenhouse', token:'elastic' },
  { name:'GitLab',       provider:'greenhouse', token:'gitlab' },
  { name:'GitHub',       provider:'greenhouse', token:'github' },
  { name:'Grafana Labs', provider:'greenhouse', token:'grafanalabs' },
  { name:'Stripe',       provider:'greenhouse', token:'stripe' },
  { name:'Canonical',    provider:'greenhouse', token:'canonical' },
];
async function fetchATS(c){
  if(c.provider==='greenhouse'){
    const r = await req({ url:`https://boards-api.greenhouse.io/v1/boards/${c.token}/jobs?content=true`, json:true });
    return (r.jobs||[]).map(j=>({ source:'🏆 '+c.name, premium:true, title:j.title, company:c.name,
      location:(j.location&&j.location.name)||'', url:j.absolute_url, description:strip(j.content), salary:'' }));
  }
  if(c.provider==='lever'){
    const r = await req({ url:`https://api.lever.co/v0/postings/${c.token}?mode=json`, json:true });
    return (Array.isArray(r)?r:[]).map(j=>({ source:'🏆 '+c.name, premium:true, title:j.text, company:c.name,
      location:(j.categories&&j.categories.location)||'', url:j.hostedUrl, description:strip(j.descriptionPlain||j.description), salary:'' }));
  }
  if(c.provider==='ashby'){
    const r = await req({ url:`https://api.ashbyhq.com/posting-api/job-board/${c.token}`, json:true });
    return (r.jobs||[]).map(j=>({ source:'🏆 '+c.name, premium:true, title:j.title, company:c.name,
      location:j.location||'', url:j.jobUrl||j.applyUrl, description:strip(j.descriptionPlain||j.description), salary:'' }));
  }
  return [];
}
for(const c of PREMIUM){
  jobs = jobs.concat(await safe('Premium:'+c.name, ()=>fetchATS(c)));
  await sleep(500);
}

// Prefiltro por sector
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
