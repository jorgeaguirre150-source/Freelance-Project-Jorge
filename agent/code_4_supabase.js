// NODO — Upsert a Supabase (passthrough)  (mode: Run Once for All Items)
// Guarda todas las ofertas en la tabla `jobs` (dedup_key unico) y pasa el item al email.
const http = (opts) => this.helpers.httpRequest(opts);
const URL = $env.SUPABASE_URL;
const KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

const d = $input.first().json;
const all = [].concat(d.shortlist || [], d.more || []);

if(URL && KEY && all.length){
  const rows = all.map(j=>({
    dedup_key: ((j.url||'') || ((j.title||'')+'|'+(j.company||''))).toLowerCase().trim(),
    source:j.source, title:j.title, company:j.company, location:j.location, url:j.url,
    salary:j.salary, description:(j.description||'').slice(0,2000),
    score:j.score, reason:j.reason,
    draft: j.draft || undefined   // no sobrescribe drafts existentes si no hay uno nuevo
  }));
  try {
    await http({ method:'POST', url:`${URL}/rest/v1/jobs?on_conflict=dedup_key`, json:true,
      headers:{ apikey:KEY, Authorization:`Bearer ${KEY}`, 'Content-Type':'application/json',
                Prefer:'resolution=merge-duplicates,return=minimal' },
      body: rows });
    console.log('Supabase upsert OK:', rows.length);
  } catch(e){ console.log('Supabase ERROR:', e.message); }
} else {
  console.log('Supabase no configurado o 0 filas — se omite el guardado.');
}

return [{ json: d }]; // passthrough para Build Email
