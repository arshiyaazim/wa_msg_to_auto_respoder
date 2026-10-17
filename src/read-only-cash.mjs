import {syntheticRows} from './synthetic-data.mjs';

const METHODS = new Set(['', 'bkash', 'nagad', 'cash', 'rocket', 'bank']);
const SOURCES = new Set(['', 'chat', 'manual', 'review']);

export function employeeIdentity(row) {
  return row.employeePhone || `record:${row.id}`;
}

function sourceMatches(row, source) {
  if (source === 'chat') return row.source === 'WhatsApp live';
  if (source === 'manual') return row.source === 'Manual';
  if (source === 'review') return row.source === 'Review';
  return true;
}

function validDate(value) {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

export function normalizeQuery(input = {}) {
  const query = {
    q: String(input.q ?? '').trim().toLocaleLowerCase(),
    method: String(input.method ?? ''),
    source: String(input.source ?? ''),
    employee: String(input.employee ?? ''),
    from: String(input.from ?? ''),
    to: String(input.to ?? '')
  };
  if (!METHODS.has(query.method) || !SOURCES.has(query.source)) throw new Error('INVALID_FILTER');
  if (!validDate(query.from) || !validDate(query.to) || query.from && query.to && query.from > query.to) {
    throw new Error('INVALID_DATE_RANGE');
  }
  return Object.freeze(query);
}

export function filterRows(rows, input = {}) {
  const query = normalizeQuery(input);
  const terms = query.q.split(/\s+/).filter(Boolean);
  return rows.filter((item) => {
    const haystack = [item.id, item.name, item.employeePhone, item.payoutPhone, item.purpose, item.sourceId]
      .join(' ')
      .toLocaleLowerCase();
    return sourceMatches(item, query.source)
      && (!query.employee || employeeIdentity(item) === query.employee)
      && (!query.method || item.method === query.method)
      && (!query.from || item.date >= query.from)
      && (!query.to || item.date <= query.to)
      && terms.every((term) => haystack.includes(term));
  });
}

export function employeeStatements(rows) {
  const groups = new Map();
  for (const item of rows) {
    const identity = employeeIdentity(item);
    const group = groups.get(identity) ?? {
      identity,
      employeePhone: item.employeePhone,
      names: [],
      payments: 0,
      amountCents: 0,
      lastDate: '',
      needsReview: 0
    };
    if (item.name && !group.names.includes(item.name)) group.names.push(item.name);
    group.payments += 1;
    group.amountCents += item.amountCents;
    group.lastDate = group.lastDate > item.date ? group.lastDate : item.date;
    if (item.issues.length) group.needsReview += 1;
    groups.set(identity, group);
  }
  return [...groups.values()]
    .sort((a, b) => b.amountCents - a.amountCents || a.identity.localeCompare(b.identity))
    .map((group) => ({...group, name: group.names.join(' / ') || 'Name unknown', aliases: group.names.length}));
}

function aggregateBy(rows, key) {
  const result = new Map();
  for (const item of rows) {
    const value = item[key];
    const prior = result.get(value) ?? {key: value, count: 0, amountCents: 0};
    prior.count += 1;
    prior.amountCents += item.amountCents;
    result.set(value, prior);
  }
  return [...result.values()].sort((a, b) => a.key.localeCompare(b.key));
}

export function summary(rows) {
  return {
    instructions: rows.length,
    postings: rows.filter((row) => row.status === 'Posted').length,
    instructionMinor: rows.reduce((total, row) => total + row.amountCents, 0),
    postedMinor: rows.filter((row) => row.status === 'Posted').reduce((total, row) => total + row.amountCents, 0),
    employees: new Set(rows.map((row) => row.employeePhone).filter(Boolean)).size,
    missingIdentity: rows.filter((row) => !row.employeePhone).length,
    needsReview: rows.filter((row) => row.issues.length > 0).length,
    bySource: aggregateBy(rows, 'source'),
    monthly: aggregateBy(rows.map((row) => ({...row, month: row.date.slice(0, 7)})), 'month')
  };
}

export function classifyReplay(events) {
  const seen = new Map();
  return events.map((event) => {
    const prior = seen.get(event.sourceKey);
    if (!prior) {
      seen.set(event.sourceKey, event.payloadHash);
      return 'FIRST_SEEN';
    }
    return prior === event.payloadHash ? 'REPLAY' : 'CONFLICT';
  });
}

export function project(input = {}) {
  const filters = normalizeQuery(input);
  const rows = filterRows(syntheticRows, filters);
  return Object.freeze({
    canWrite: false,
    sourceLabel: 'Synthetic read-only projection',
    checkedAt: '2026-10-17T00:00:00+06:00',
    filters,
    counts: summary(rows),
    rows,
    employees: employeeStatements(rows),
    daily: aggregateBy(rows.map((row) => ({...row, day: row.date})), 'day')
  });
}
