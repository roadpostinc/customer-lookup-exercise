import express, { type ErrorRequestHandler } from 'express';
import { billingAccounts, crmAccounts, sortedInvoices } from './seed.js';

export const profiles = ['healthy', 'crm-timeout', 'crm-transient', 'billing-rate-limit', 'billing-down'] as const;
export type Profile = typeof profiles[number];
type Kind = 'crm' | 'billing';
export interface MockOptions { crmKey?: string; billingToken?: string; adminKey?: string }

function integer(value: unknown, fallback: number, minimum: number, maximum: number): number {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || !/^\d+$/.test(value)) throw new Error('Invalid integer parameter');
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < minimum || number > maximum) throw new Error('Parameter out of range');
  return number;
}
function encodeCursor(scope: string, offset: number): string {
  return Buffer.from(`${scope}:${offset}`).toString('base64url');
}
function decodeCursor(value: unknown, scope: string): number {
  if (value === undefined) return 0;
  if (typeof value !== 'string') throw new Error('Invalid cursor');
  const decoded = Buffer.from(value, 'base64url').toString();
  const prefix = `${scope}:`;
  if (!decoded.startsWith(prefix)) throw new Error('Cursor belongs to a different collection');
  const offset = integer(decoded.slice(prefix.length), 0, 0, Number.MAX_SAFE_INTEGER);
  if (encodeCursor(scope, offset) !== value) throw new Error('Invalid cursor');
  return offset;
}

export function createMock(kind: Kind, options: MockOptions = {}) {
  const app = express();
  let profile: Profile = 'healthy';
  const counts = new Map<string, number>();
  const adminKey = options.adminKey ?? 'demo-admin-key';
  app.use(express.json());
  app.get('/health', (_req, res) => res.json({ status: 'ok', provider: kind }));
  app.use('/__admin', (req, res, next) => {
    if (req.header('X-Mock-Admin-Key') !== adminKey) { res.status(401).json({ error: 'Unauthorized' }); return; }
    next();
  });
  app.get('/__admin/state', (_req, res) => res.json({ profile, requests: Object.fromEntries(counts) }));
  app.post('/__admin/profile', (req, res) => {
    if (!profiles.includes(req.body?.profile)) { res.status(400).json({ error: 'Unknown profile', profiles }); return; }
    profile = req.body.profile;
    counts.clear();
    res.json({ profile });
  });
  app.use((req, res, next) => {
    const authorized = kind === 'crm'
      ? req.header('X-CRM-Key') === (options.crmKey ?? 'demo-crm-key')
      : req.header('Authorization') === `Bearer ${options.billingToken ?? 'demo-billing-token'}`;
    if (!authorized) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const target = `${req.method} ${req.originalUrl}`;
    const count = (counts.get(target) ?? 0) + 1;
    counts.set(target, count);
    if (kind === 'crm' && profile === 'crm-timeout') {
      const timer = setTimeout(() => { if (!res.destroyed) next(); }, 1500);
      res.on('close', () => clearTimeout(timer));
      return;
    }
    if (kind === 'crm' && profile === 'crm-transient' && count <= 2) {
      res.status(503).json({ error: 'CRM temporarily unavailable' }); return;
    }
    if (kind === 'billing' && profile === 'billing-rate-limit' && count === 1) {
      res.set('Retry-After', '1').status(429).json({ error: 'Rate limit exceeded' }); return;
    }
    if (kind === 'billing' && profile === 'billing-down') {
      res.status(503).json({ error: 'Billing unavailable' }); return;
    }
    next();
  });
  if (kind === 'crm') {
    app.get('/crm/accounts', (req, res) => {
      const offset = integer(req.query.offset, 0, 0, Number.MAX_SAFE_INTEGER);
      const limit = integer(req.query.limit, 3, 1, 3);
      res.json({ records: crmAccounts.slice(offset, offset + limit), next_offset: offset + limit < crmAccounts.length ? offset + limit : null });
    });
    app.get('/crm/accounts/by-reference/:customerRef', (req, res) => {
      const records = crmAccounts.filter(row => row.customer_ref === req.params.customerRef);
      if (!records.length) { res.status(404).json({ error: 'Customer reference not found' }); return; }
      res.json({ records });
    });
  } else {
    app.get('/billing/accounts', (req, res) => {
      const offset = decodeCursor(req.query.cursor, 'accounts');
      const limit = integer(req.query.pageSize, 3, 1, 3);
      res.json({ items: billingAccounts.slice(offset, offset + limit), nextCursor: offset + limit < billingAccounts.length ? encodeCursor('accounts', offset + limit) : null });
    });
    app.get('/billing/accounts/by-reference/:customerRef', (req, res) => {
      const account = billingAccounts.find(row => row.externalCustomerRef === req.params.customerRef);
      if (!account) { res.status(404).json({ error: 'Customer reference not found' }); return; }
      res.json({ account });
    });
    app.get('/billing/accounts/:accountId/invoices', (req, res) => {
      if (!billingAccounts.some(row => row.accountId === req.params.accountId)) { res.status(404).json({ error: 'Account not found' }); return; }
      const scope = `invoices-${req.params.accountId}`;
      const offset = decodeCursor(req.query.cursor, scope);
      const limit = integer(req.query.pageSize, 3, 1, 3);
      const rows = sortedInvoices(req.params.accountId);
      res.json({ items: rows.slice(offset, offset + limit), nextCursor: offset + limit < rows.length ? encodeCursor(scope, offset + limit) : null });
    });
  }
  app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));
  const errorHandler: ErrorRequestHandler = (_error, _req, res, _next) => { res.status(400).json({ error: 'Invalid request or pagination parameters' }); };
  app.use(errorHandler);
  return app;
}
