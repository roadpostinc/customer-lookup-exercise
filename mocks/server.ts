import { createMock } from './app.js';

const options = { crmKey: process.env.CRM_KEY, billingToken: process.env.BILLING_TOKEN, adminKey: process.env.MOCK_ADMIN_KEY };
const host = process.env.MOCK_HOST ?? '127.0.0.1';
const servers = (['crm', 'billing'] as const).map(kind => {
  const port = Number(kind === 'crm' ? process.env.CRM_PORT ?? 4101 : process.env.BILLING_PORT ?? 4102);
  const server = createMock(kind, options).listen(port, host, () => console.log(`${kind}: http://${host}:${port}`));
  server.on('error', error => { console.error(error.message); process.exit(1); });
  return server;
});
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => { for (const server of servers) server.close(); });
}
