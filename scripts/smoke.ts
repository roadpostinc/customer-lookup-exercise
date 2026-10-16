import assert from 'node:assert/strict';
import { config } from '../src/config.js';

for (const [url, headers, path, key] of [
  [config.crmUrl, { 'X-CRM-Key': config.crmKey }, '/crm/accounts?limit=1', 'records'],
  [config.billingUrl, { Authorization: `Bearer ${config.billingToken}` }, '/billing/accounts?pageSize=1', 'items'],
] as const) {
  const health = await fetch(`${url}/health`, { signal: AbortSignal.timeout(3000) });
  assert.equal(health.status, 200);
  const unauthorized = await fetch(`${url}${path}`, { signal: AbortSignal.timeout(3000) });
  assert.equal(unauthorized.status, 401);
  const response = await fetch(`${url}${path}`, { headers, signal: AbortSignal.timeout(3000) });
  assert.equal(response.status, 200, 'Use the healthy profile for smoke checks');
  const body = await response.json();
  assert.equal(body[key].length, 1);
  console.log(`${url}: health, authentication, and first page OK`);
}
