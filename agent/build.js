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
  { id: id(), name: 'Schedule Trigger 07:00', type: 'n8n-nodes-base.scheduleTrigger', typeVersion: 1.2, position: [240, 300],
    parameters: { rule: { interval: [{ field: 'cronExpression', expression: '0 7 * * *' }] } } },
  codeNode('1. Ingest + Dedup', 460, read('code_1_ingest.js')),
  codeNode('2. AI Score + Draft', 680, read('code_2_ai.js')),
  codeNode('3. Upsert Supabase', 900, read('code_4_supabase.js')),
  codeNode('4. Build Email', 1120, read('code_3_email.js')),
  { id: id(), name: '5. Send Email', type: 'n8n-nodes-base.emailSend', typeVersion: 2.1, position: [1340, 300],
    parameters: { fromEmail: 'aguirre_coslada@hotmail.com', toEmail: 'aguirre_coslada@hotmail.com',
      subject: '={{ $json.subject }}', emailFormat: 'html', html: '={{ $json.html }}', options: {} } }
];

const link = (from, to) => ({ [from]: { main: [[{ node: to, type: 'main', index: 0 }]] } });
const connections = Object.assign({},
  link('Schedule Trigger 07:00', '1. Ingest + Dedup'),
  link('1. Ingest + Dedup', '2. AI Score + Draft'),
  link('2. AI Score + Draft', '3. Upsert Supabase'),
  link('3. Upsert Supabase', '4. Build Email'),
  link('4. Build Email', '5. Send Email')
);

const wf = { name: 'Daily Freelance Hunter', nodes, connections, active: false, settings: { executionOrder: 'v1' } };
const out = path.join(dir, 'daily_freelance_hunter.n8n.json');
fs.writeFileSync(out, JSON.stringify(wf, null, 2), 'utf8');
JSON.parse(fs.readFileSync(out, 'utf8'));
console.log('OK | nodes:', nodes.length, '|', (fs.statSync(out).size / 1024).toFixed(1), 'KB');
