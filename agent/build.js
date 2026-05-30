const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dir = __dirname;
const read = (f) => fs.readFileSync(path.join(dir, f), 'utf8');
const id = () => crypto.randomUUID();
const codeNode = (name, x, code) => ({
  id: id(), name, type: 'n8n-nodes-base.code', typeVersion: 2, position: [x, 300],
  parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: code }
});

const nodes = [
  // Dispara la BUSQUEDA a las 08:30 todos los dias
  { id: id(), name: 'Cron 08:30 (busqueda)', type: 'n8n-nodes-base.scheduleTrigger', typeVersion: 1.2, position: [200, 300],
    parameters: { rule: { interval: [{ field: 'cronExpression', expression: '30 8 * * *' }] } } },
  codeNode('1. Ingest + Dedup', 400, read('code_1_ingest.js')),
  codeNode('2. AI Score + Draft', 600, read('code_2_ai.js')),
  codeNode('3. Upsert Supabase', 800, read('code_4_supabase.js')),
  // Espera ~30 min -> el reporte se envia hacia las 09:00
  { id: id(), name: 'Wait -> 09:00', type: 'n8n-nodes-base.wait', typeVersion: 1.1, position: [1000, 300],
    parameters: { resume: 'timeInterval', amount: 30, unit: 'minutes' } },
  codeNode('4. Build Email', 1200, read('code_3_email.js')),
  { id: id(), name: '5. Send Email 09:00', type: 'n8n-nodes-base.emailSend', typeVersion: 2.1, position: [1400, 300],
    parameters: { fromEmail: 'aguirre_coslada@hotmail.com', toEmail: 'aguirre_coslada@hotmail.com',
      subject: '={{ $json.subject }}', emailFormat: 'html', html: '={{ $json.html }}', options: {} } }
];

const link = (from, to) => ({ [from]: { main: [[{ node: to, type: 'main', index: 0 }]] } });
const connections = Object.assign({},
  link('Cron 08:30 (busqueda)', '1. Ingest + Dedup'),
  link('1. Ingest + Dedup', '2. AI Score + Draft'),
  link('2. AI Score + Draft', '3. Upsert Supabase'),
  link('3. Upsert Supabase', 'Wait -> 09:00'),
  link('Wait -> 09:00', '4. Build Email'),
  link('4. Build Email', '5. Send Email 09:00')
);

const wf = { name: 'Daily Freelance Hunter', nodes, connections, active: false, settings: { executionOrder: 'v1' } };
const out = path.join(dir, 'daily_freelance_hunter.n8n.json');
fs.writeFileSync(out, JSON.stringify(wf, null, 2), 'utf8');
JSON.parse(fs.readFileSync(out, 'utf8'));
console.log('OK | nodes:', nodes.length, '|', (fs.statSync(out).size / 1024).toFixed(1), 'KB');
