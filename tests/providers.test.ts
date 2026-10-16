import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createMock } from '../mocks/app.js';

describe('provided upstream infrastructure', () => {
  it('requires CRM authentication and returns an offset page', async () => {
    const app = createMock('crm');
    expect((await request(app).get('/crm/accounts')).status).toBe(401);
    const page = await request(app).get('/crm/accounts?limit=1').set('X-CRM-Key', 'demo-crm-key');
    expect(page.status).toBe(200);
    expect(page.body.records).toHaveLength(1);
    expect(page.body.next_offset).toBe(1);
  });
  it('returns a Billing cursor and rejects invalid pagination', async () => {
    const app = createMock('billing');
    const page = await request(app).get('/billing/accounts?pageSize=1').auth('demo-billing-token', { type: 'bearer' });
    expect(page.status).toBe(200);
    expect(page.body.items).toHaveLength(1);
    expect(typeof page.body.nextCursor).toBe('string');
    const invalid = await request(app).get('/billing/accounts?cursor=invalid').auth('demo-billing-token', { type: 'bearer' });
    expect(invalid.status).toBe(400);
  });
});
