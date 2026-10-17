import test from 'node:test';
import assert from 'node:assert/strict';
import {createProjectionServer} from '../src/server.mjs';

test('loopback API is GET-only and serves synthetic projection', async (t) => {
  const server = createProjectionServer({port: 0});
  t.after(() => server.close());
  await new Promise((resolve) => server.once('listening', resolve));
  const address = server.address();
  const base = `http://127.0.0.1:${address.port}`;
  const get = await fetch(`${base}/api/cash/summary?source=chat&from=2026-10-01&to=2026-10-02`);
  assert.equal(get.status, 200);
  assert.equal((await get.json()).canWrite, false);
  const post = await fetch(`${base}/api/cash/summary`, {method: 'POST'});
  assert.equal(post.status, 405);
});
