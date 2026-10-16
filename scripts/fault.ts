import { config } from '../src/config.js';
import { profiles } from '../mocks/app.js';

const profile = process.argv[2];
if (!profiles.some(value => value === profile)) {
  console.error(`Usage: npm run fault -- ${profiles.join('|')}`);
  process.exit(1);
}
for (const url of [config.crmUrl, config.billingUrl]) {
  const response = await fetch(`${url}/__admin/profile`, {
    method: 'POST', signal: AbortSignal.timeout(3000),
    headers: { 'Content-Type': 'application/json', 'X-Mock-Admin-Key': process.env.MOCK_ADMIN_KEY ?? 'demo-admin-key' },
    body: JSON.stringify({ profile }),
  });
  if (!response.ok) throw new Error(`Profile change failed at ${url}: ${response.status}. Reset both providers before continuing.`);
  console.log(`${url}: ${profile} (counters reset)`);
}
