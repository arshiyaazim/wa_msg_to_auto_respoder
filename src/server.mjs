import {createServer} from 'node:http';
import {project} from './read-only-cash.mjs';

function json(response, status, value) {
  response.writeHead(status, {'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store'});
  response.end(JSON.stringify(value));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char]));
}

function renderPage(data) {
  const rows = data.rows.map((row) => `<tr><td>${escapeHtml(row.date)}</td><td>${escapeHtml(row.name)}</td><td>${escapeHtml(row.employeePhone || 'Not available')}</td><td>${escapeHtml(row.payoutPhone || 'Not separately provided')}</td><td>${escapeHtml(row.source)}</td><td>${escapeHtml(row.method)}</td><td>BDT ${(row.amountCents / 100).toFixed(2)}</td></tr>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Cash read-only projection</title><style>body{font:14px system-ui,sans-serif;color:#17344a;background:#f4f7f9;margin:0;padding:24px}main{max-width:1200px;margin:auto;background:white;padding:24px;border:1px solid #dce5eb;border-radius:8px}table{width:100%;border-collapse:collapse;overflow:auto}th,td{text-align:left;padding:10px;border-bottom:1px solid #e5edf2}th{background:#eef5f8}small{color:#637b89}@media(max-width:650px){body{padding:10px}main{padding:14px}table{min-width:850px}main{overflow:auto}}</style></head><body><main><h1>Cash Payment · read-only projection</h1><p><small>Synthetic data only · canWrite=false · no production connection</small></p><p>${data.rows.length} matching rows · BDT ${(data.counts.instructionMinor / 100).toFixed(2)} · ${data.counts.employees} employee identities</p><table><thead><tr><th>Date</th><th>Employee</th><th>Employee ID</th><th>Payout mobile</th><th>Source</th><th>Method</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table></main></body></html>`;
}

export function createProjectionServer({host = '127.0.0.1', port = 3210} = {}) {
  const server = createServer((request, response) => {
    if (request.method !== 'GET') {
      response.writeHead(405, {'allow': 'GET', 'cache-control': 'no-store'});
      response.end('GET only');
      return;
    }
    const url = new URL(request.url || '/', 'http://127.0.0.1');
    if (url.pathname === '/api/cash/summary') {
      try {
        json(response, 200, project(Object.fromEntries(url.searchParams)));
      } catch (error) {
        json(response, 400, {error: error instanceof Error ? error.message : 'INVALID_REQUEST'});
      }
      return;
    }
    if (url.pathname === '/') {
      response.writeHead(200, {'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store'});
      response.end(renderPage(project()));
      return;
    }
    json(response, 404, {error: 'NOT_FOUND'});
  });
  return server.listen(port, host);
}

if (process.argv[1]?.endsWith('/src/server.mjs')) {
  const server = createProjectionServer();
  server.on('listening', () => console.log(`read-only projection listening on http://${server.address().address}:${server.address().port}`));
}
