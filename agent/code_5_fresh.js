// NODO — Build "Fresh News" (SOLO empresas TOP, prioritario)  (Run Once for All Items)
const d = $input.first().json;
const premium = d.premium || [];
const today = new Date().toISOString().slice(0,10);
const esc = (s)=> (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

const cards = premium.map((j,i)=>{
  const draftBox = j.draft ? `<div style="background:#fffdf5;border-left:3px solid #F6B73C;padding:10px 12px;margin-top:8px;font-size:12.5px;color:#34465a;white-space:pre-wrap;">${esc(j.draft)}</div>` : '';
  return `
  <div style="border:1px solid #F6D98A;background:#fffdf5;border-radius:10px;padding:14px 16px;margin:10px 0;">
    <div style="font-size:11px;color:#9a6b00;font-weight:700;letter-spacing:.04em;">${esc(j.source)} &middot; MATCH ${j.score}</div>
    <div style="font-size:16px;font-weight:800;color:#0A1A2F;margin:3px 0;">${i+1}. ${esc(j.title)}</div>
    <div style="font-size:13px;color:#5b6b7c;">${esc(j.company)} &middot; ${esc(j.location)}${j.salary?(' &middot; '+esc(j.salary)):''}</div>
    <div style="font-size:12px;color:#8a3b1c;margin:4px 0;font-style:italic;">${esc(j.reason)}</div>
    <a href="${esc(j.url)}" style="display:inline-block;font-size:13px;color:#b9810c;font-weight:700;text-decoration:none;margin:2px 0;">Ver oferta y aplicar &rarr;</a>
    ${draftBox}
  </div>`;
}).join('');

const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:720px;margin:auto;background:#fff;">
  <div style="background:linear-gradient(120deg,#7a5200,#c8941b);color:#fff;padding:22px 24px;border-radius:12px 12px 0 0;">
    <div style="font-size:20px;font-weight:800;">🏆 Fresh News — Empresas TOP</div>
    <div style="font-size:13px;color:#ffe9b8;">${today} &middot; ${premium.length} oportunidades (freelance o fijo)</div>
  </div>
  <div style="padding:8px 16px 20px;">
    ${cards || '<p style="color:#5b6b7c;padding:12px;">Sin novedades de empresas top hoy.</p>'}
    <p style="color:#9aa7b4;font-size:11px;margin-top:22px;">Directo de los boards oficiales (Greenhouse/Lever/Ashby). Prioridad máxima.</p>
  </div>
</div>`;

return [{ json:{ html, subject:`🏆 Fresh News — ${premium.length} en empresas TOP — ${today}` } }];
