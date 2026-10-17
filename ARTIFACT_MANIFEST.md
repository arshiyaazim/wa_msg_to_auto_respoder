# T5.1 artifact manifest

Status: assembled in the approved non-production staging root on
2026-10-17 (Asia/Dhaka).

## Contents

- `package.json` — dependency-free local commands; no package install needed.
- `src/synthetic-data.mjs` — synthetic rows/events only.
- `src/read-only-cash.mjs` — pure in-memory projection logic.
- `src/server.mjs` — loopback GET-only API and HTML view.
- `tests/projection.test.mjs` — pure synthetic behavior/unit tests only.
- `tests/server.test.mjs` — separately gated loopback API contract test; not
  executed in the current approval scope.
- `tests/static-safety.mjs` — runtime import/call/file/network denylist checks.
- `README.md` — usage and safety boundary.

## Exclusions verified by design

No PostgreSQL client, password file, Bridge-1 socket/token, raw WhatsApp data,
production API/auth module, migration, cursor, posting function, credential or
external dependency is included.

Runtime code uses no `node:fs`; filesystem access exists only in the test-only
static scanner. The only network capability is a loopback `node:http` server
bound to `127.0.0.1`; no outbound HTTP client is imported or called.

## Execution record

- Artifact assembly: completed.
- Static shell scan: executed separately after assembly.
- Node `--check` for all three runtime files: executed with local Node
  `v22.23.3`, exit code 0.
- Static safety test: executed with local Node `v22.23.3`, exit code 0.
- Pure unit tests in `tests/projection.test.mjs`: executed with local Node
  `v22.23.3`, exit code 0.
- `tests/server.test.mjs` loopback API test: NOT RUN; separate approval
  remains required.
- Dependency installation/network access: not attempted.
- Production/runtime/database/Bridge-1 access: not attempted.
