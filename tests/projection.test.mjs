import test from 'node:test';
import assert from 'node:assert/strict';
import {syntheticEvents, syntheticRows} from '../src/synthetic-data.mjs';
import {classifyReplay, employeeIdentity, employeeStatements, filterRows, project} from '../src/read-only-cash.mjs';

test('synthetic data contains separate employee and payout mobiles', () => {
  const row = syntheticRows.find((item) => item.id === 'synthetic-wa-001');
  assert.notEqual(row.employeePhone, row.payoutPhone);
});

test('same employee mobile groups aliases without merging a different mobile', () => {
  const groups = employeeStatements(syntheticRows);
  const alpha = groups.find((group) => group.employeePhone === '01300000001');
  assert.equal(alpha.aliases, 2);
  assert.equal(groups.some((group) => group.employeePhone === '01300000002'), true);
});

test('source separation, search and inclusive date range work on synthetic rows', () => {
  assert.equal(filterRows(syntheticRows, {source: 'manual'}).length, 1);
  assert.equal(filterRows(syntheticRows, {q: 'alpha', from: '2026-10-01', to: '2026-10-02'}).length, 2);
  assert.equal(filterRows(syntheticRows, {source: 'review'}).length, 1);
});

test('name-only review row has record identity and remains separate', () => {
  const row = syntheticRows.find((item) => item.id === 'synthetic-review-001');
  assert.equal(employeeIdentity(row), 'record:synthetic-review-001');
  assert.equal(project({source: 'review'}).counts.missingIdentity, 1);
});

test('same source replay and changed payload conflict are classified', () => {
  assert.deepEqual(classifyReplay(syntheticEvents), ['FIRST_SEEN', 'REPLAY', 'CONFLICT']);
});

test('projection explicitly cannot write', () => {
  const result = project();
  assert.equal(result.canWrite, false);
  assert.equal(typeof result.counts.monthly[0].amountCents, 'number');
});
