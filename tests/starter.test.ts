import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { openDatabase } from '../src/db.js';

describe('starter infrastructure', () => {
  it('serves a health endpoint', async () => {
    const response = await request(createApp()).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('supports SQLite statements and transactions', () => {
    const db = openDatabase(':memory:');
    try {
      db.exec('CREATE TABLE example (id TEXT PRIMARY KEY); BEGIN;');
      db.prepare('INSERT INTO example VALUES (?)').run('example');
      db.exec('ROLLBACK;');
      expect(db.prepare('SELECT COUNT(*) AS count FROM example').get()?.count).toBe(0);
    } finally { db.close(); }
  });
});
