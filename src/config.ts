export const config = {
  port: Number(process.env.PORT ?? 3000),
  crmUrl: process.env.CRM_URL ?? 'http://127.0.0.1:4101',
  billingUrl: process.env.BILLING_URL ?? 'http://127.0.0.1:4102',
  crmKey: process.env.CRM_KEY ?? 'demo-crm-key',
  billingToken: process.env.BILLING_TOKEN ?? 'demo-billing-token',
  databasePath: process.env.DATABASE_PATH ?? './data/reconciliation.sqlite',
  now: process.env.EXERCISE_NOW ?? '2030-01-15T12:00:00Z',
};
