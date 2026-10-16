import { createApp } from './app.js';
import { config } from './config.js';

const server = createApp().listen(config.port, '127.0.0.1', () => {
  console.log(`Customer Lookup: http://127.0.0.1:${config.port}`);
});
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
