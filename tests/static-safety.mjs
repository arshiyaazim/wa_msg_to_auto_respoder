import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const runtimeFiles = ['src/synthetic-data.mjs', 'src/read-only-cash.mjs', 'src/server.mjs'];
const source = runtimeFiles.map((path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')).join('\n');
const forbidden = [
  /\bpg\b/i,
  /password|PGPASSWORD_FILE|DATABASE_URL|PGHOST/i,
  /\/etc\/vps|\/run\/secrets|\/var\/lib\/vps|mcp\.sock|whatsapp\.db/i,
  /\b(?:INSERT|UPDATE|DELETE|TRUNCATE|CREATE|ALTER)\b/i,
  /db:(?:migrate|import)|pg_advisory_xact_lock|alrifai_post_cash/i,
  /send_message|send_file|fetch\s*\(/i,
  /node:(?:fs|net|tls|https|dgram|child_process)/i,
  /http\.(?:request|get)\s*\(/i
];
for (const pattern of forbidden) assert.equal(pattern.test(source), false, `forbidden runtime marker: ${pattern}`);
assert.match(source, /createServer/);
assert.match(source, /server\.listen\(port, host\)/);
assert.match(source, /host = '127\.0\.0\.1'/);
assert.doesNotMatch(readFileSync(new URL('../package.json', import.meta.url), 'utf8'), /"dependencies"/);
console.log(`static safety checks inspected ${runtimeFiles.length} runtime files`);
