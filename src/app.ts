import express from 'express';

export function createApp() {
  const app = express();
  app.use(express.json());
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.get('/v1/customers/:customerRef', (_req, res) => {
    // Implement your internal customer contract here.
    res.status(501).json({ error: 'Customer lookup is not implemented yet' });
  });
  return app;
}
