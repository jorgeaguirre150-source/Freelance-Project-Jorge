const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dir = __dirname;
const read = (f) => fs.readFileSync(path.join(dir, f), 'utf8');
const id = () => crypto.randomUUID();
const codeNode = (name, x, y, code) => ({
  id: id(), name, type: 'n8n-nodes-base.code', typeVersion: 2, position: [x, y],
  parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: code }
});
const emailNode = (name, x, y) => ({
  id: id(), name, type: 'n8n-nodes-base.emailSend', typeVersion: 2.1, position: [x, y],
  parameters: { fromEmail: 'aguirre_coslada@hotmail.com', toEmail: 'aguirre_coslada@hotmail.com',
    subject: '={{ $json.subject }}', emailFormat: 'html', html: '={{ $json.html }}', options: {} }
});

const nodes = [
  { id: id(), name: 'Cron 08:30 (busqueda)', type: 'n8n-nodes-base.scheduleTrigger', typeVersion: 1.2, position: [180, 300],
    parameters: { rule: { interval: [{ field: 'cronExpression', expression: '30 8 * * *' }] } } },
  codeNode('1. Ingest + Dedup', 380, 300, read('code_1_ingest.js')),
  codeNode('2. AI Score + Draft', 580, 300, read('code_2_ai.js')),
  codeNode('3. Upsert Supabase', 780, 300, read('code_4_supabase.js')),
  { id: id(), name: 'Wait -> 09:00', type: 'n8n-nodes-base.wait', typeVersion: 1.1, position: [980, 300],
    parameters: { resume: 'timeInterval', amount: 30, unit: 'minutes' } },
  // Rama A: reporte general
  codeNode('4. Build Email General', 1180, 200, read('code_3_email.js')),
  emailNode('5. Send General 09:00', 1380, 200),
  // Rama B: Fresh News empresas TOP (prioritario)
  codeNode('6. Build Fresh News (TOP)', 1180, 420, read('code_5_fresh.js')),
  emailNode('7. Send Fresh News 09:00', 1380, 420)
];

const one = (to) => ({ node: to, type: 'main', index: 0 });
const connections = {
  'Cron 08:30 (busqueda)': { main: [[one('1. Ingest + Dedup')]] },
  '1. Ingest + Dedup':     { main: [[one('2. AI Score + Draft')]] },
  '2. AI Score + Draft':   { main: [[one('3. Upsert Supabase')]] },
  '3. Upsert Supabase':    { main: [[one('Wait -> 09:00')]] },
  // Wait dispara las DOS ramas
  'Wait -> 09:00':         { main: [[one('4. Build Email General'), one('6. Build Fresh News (TOP)')]] },
  '4. Build Email General': { main: [[one('5. Send General 09:00')]] },
  '6. Build Fresh News (TOP)': { main: [[one('7. Send Fresh News 09:00')]] }
};

const wf = { name: 'Daily Freelance Hunter', nodes, connections, active: false, settings: { executionOrder: 'v1' } };
const out = path.join(dir, 'daily_freelance_hunter.n8n.json');
fs.writeFileSync(out, JSON.stringify(wf, null, 2), 'utf8');
JSON.parse(fs.readFileSync(out, 'utf8'));
console.log('OK | nodes:', nodes.length, '|', (fs.statSync(out).size / 1024).toFixed(1), 'KB');
