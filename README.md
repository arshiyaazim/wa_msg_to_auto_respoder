# AL-RIFA'I Cash Read-only Projection

This is a non-production, synthetic-only executable projection assembled for
contract inspection. It is not the Cash Payment application and is not a
replacement for `/cash`, `/api/cash`, PostgreSQL or Bridge-1.

## Safety boundary

- Data is defined in `src/synthetic-data.mjs`; no production data is loaded.
- Runtime code uses only Node's built-in `node:http` module for a loopback
  server. It has no PostgreSQL, password-file, Bridge-1, cursor, migration,
  posting or outbound-message dependency.
- Only `GET /` and `GET /api/cash/summary` are served. Other methods return
  `405 Method Not Allowed`; no mutation endpoint exists.
- The server binds to `127.0.0.1` only and makes no outbound network request.
- Runtime projection files do not read or write files. The static safety test
  uses test-only file reads to inspect the projection source.

## Files

- `src/synthetic-data.mjs` — frozen synthetic rows/events.
- `src/read-only-cash.mjs` — pure filtering, grouping, summary and replay-
  classification helpers.
- `src/server.mjs` — loopback GET-only API and synthetic HTML view.
- `tests/projection.test.mjs` — pure synthetic unit tests.
- `tests/server.test.mjs` — separately gated loopback API contract test; not
  run in the current test scope.
- `tests/static-safety.mjs` — source/import/runtime denylist checks.
- `ARTIFACT_MANIFEST.md` — provenance, boundaries and execution record.

## Commands

These commands are prepared but were only executed if the local Node runtime
was available. They never install dependencies or access production services:

```text
npm run safety
npm run build
npm test
npm start
```

The server/API test is intentionally separate and must not be run without
the dedicated loopback-isolation approval:

```text
node --test tests/server.test.mjs
```

No dependency installation is required. This staging artifact must not be
connected to production or used to infer live Cash behavior.
