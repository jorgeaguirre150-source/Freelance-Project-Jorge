// NODO 4 — Build Email HTML  (mode: Run Once for All Items)
// Seccion 0: 🏆 Empresas TOP. Seccion A: shortlist con borrador. Seccion B: todas las demas.
const d = $input.first().json;
const premium = d.premium || [];
const short   = d.shortlist || [];
const more    = d.more || [];
const today = new Date().toISOString().slice(0,10);
const esc = (s)=> (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

function card(j, n, gold){
  const draftBox = j.draft ? `<div style="background:#f7fafc;border-left:3px solid ${gold?'#F6B73C':'#16C2C2'};padding:10px 12px;margin-top:8px;font-size:12.5px;color:#34465a;white-space:pre-wrap;">${esc(j.draft)}</div>` : '';
  return `
  <div style="border:1px solid ${gold?'#F6D98A':'#e2e8f0'};border-radius:10px;padding:14px 16px;margin:10px 0;${gold?'background:#fffdf5;':''}">
    <div style="font-size:11px;color:${gold?'#9a6b00':'#0d6e74'};font-weight:700;letter-spacing:.04em;">${esc(j.source)} &middot; MATCH ${j.score}</div>
    <div style="font-size:16px;font-weight:800;color:#0A1A2F;margin:3px 0;">${n}. ${esc(j.title)}</div>
    <div style="font-size:13px;color:#5b6b7c;">${esc(j.company)} &middot; ${esc(j.location)}${j.salary?(' &middot; '+esc(j.salary)):''}</div>
    <div style="font-size:12px;color:#8a3b1c;margin:4px 0;font-style:italic;">${esc(j.reason)}</div>
    <a href="${esc(j.url)}" style="display:inline-block;font-size:13px;color:#16C2C2;font-weight:700;text-decoration:none;margin:2px 0;">Ver oferta y aplicar &rarr;</a>
    ${draftBox}
  </div>`;
}

const premiumCards = premium.map((j,i)=>card(j,i+1,true)).join('');
const shortCards   = short.map((j,i)=>card(j,i+1,false)).join('');
const moreRows = more.map((j)=>`
  <tr>
    <td style="padding:6px 8px;border-bottom:1px solid #eef2f7;font-weight:700;color:#0A1A2F;font-size:12px;">${j.score}</td>
    <td style="padding:6px 8px;border-bottom:1px solid #eef2f7;font-size:12px;"><a href="${esc(j.url)}" style="color:#0d6e74;text-decoration:none;">${esc(j.title)}</a></td>
    <td style="padding:6px 8px;border-bottom:1px solid #eef2f7;font-size:12px;color:#5b6b7c;">${esc(j.company)}</td>
    <td style="padding:6px 8px;border-bottom:1px solid #eef2f7;font-size:11px;color:#8a96a3;">${esc(j.source)} &middot; ${esc(j.location)}</td>
  </tr>`).join('');

const moreTable = more.length ? `
  <h3 style="color:#0A1A2F;font-size:15px;margin:22px 16px 6px;">Todas las demas opciones (${more.length})</h3>
  <table style="width:calc(100% - 32px);margin:0 16px;border-collapse:collapse;">
    <tr style="text-align:left;color:#8a96a3;font-size:11px;"><th style="padding:6px 8px;">Match</th><th style="padding:6px 8px;">Puesto</th><th style="padding:6px 8px;">Empresa</th><th style="padding:6px 8px;">Fuente</th></tr>
    ${moreRows}
  </table>` : '';

const premiumBlock = premium.length ? `
  <h3 style="color:#9a6b00;font-size:16px;margin:16px 0 4px;">🏆 Empresas TOP (freelance o fijo) — ${premium.length}</h3>
  ${premiumCards}` : '';

const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:720px;margin:auto;background:#fff;">
  <div style="background:linear-gradient(120deg,#0A1A2F,#0d6e74);color:#fff;padding:22px 24px;border-radius:12px 12px 0 0;">
    <div style="font-size:20px;font-weight:800;">Daily Freelance Hunter</div>
    <div style="font-size:13px;color:#9fe6e6;">${today} &middot; ${d.total} oportunidades &middot; ${premium.length} en empresas top</div>
  </div>
  <div style="padding:8px 16px 20px;">
    ${premiumBlock}
    <h3 style="color:#0A1A2F;font-size:15px;margin:18px 0 4px;">Top ${short.length} con borrador listo</h3>
    ${shortCards || '<p style="color:#5b6b7c;padding:12px;">Sin mas ofertas con borrador hoy.</p>'}
    ${moreTable}
    <p style="color:#9aa7b4;font-size:11px;margin-top:22px;">Generado automaticamente. Revisa cada borrador antes de enviar. No se ha aplicado a nada por ti.</p>
  </div>
</div>`;

return [{ json:{ html, subject:`${d.total} ofertas (${premium.length} top) — ${today}` } }];
