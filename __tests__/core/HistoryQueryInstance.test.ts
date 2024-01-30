import { FlureeClient } from '../../src';
import { FlureeError } from '../../src/core/FlureeError';

describe('HistoryQueryInstance', () => {
  it('can send a history query', async () => {
    const client = await new FlureeClient({
      host: process.env.FLUREE_CLIENT_TEST_HOST,
      port: Number(process.env.FLUREE_CLIENT_TEST_PORT),
      ledger: 'fluree-client/history',
      create: true,
    }).connect();
    const response = await client
      .history({
        'commit-details': true,
        t: { at: 'latest' },
      })
      .send();
    expect(response).toBeDefined();
  });

  it('throws error on invalid query syntax', async () => {
    const client = await new FlureeClient({
      host: process.env.FLUREE_CLIENT_TEST_HOST,
      port: Number(process.env.FLUREE_CLIENT_TEST_PORT),
      ledger: 'fluree-client/history-syntax-error',
      create: true,
    }).connect();
    let error;
    try {
      await client
        .history({
          t: { at: 'latest' },
        })
        .send();
    } catch (e) {
      error = e;
    }
    expect(error).toBeDefined();
    expect(error).toBeInstanceOf(FlureeError);
    if (error instanceof FlureeError) {
      expect(error.message).toBe(
        'either the history or commit-details key is required'
      );
    }
  });

  it('throws error on invalid query', async () => {
    const client = await new FlureeClient({
      host: process.env.FLUREE_CLIENT_TEST_HOST,
      port: Number(process.env.FLUREE_CLIENT_TEST_PORT),
      ledger: 'fluree-client/history-query-error',
      create: true,
    }).connect();
    let error;
    try {
      await client
        .history({
          'commit-details': true,
          t: { at: -5 },
        })
        .send();
    } catch (e) {
      error = e;
    }
    expect(error).toBeDefined();
    expect(error).toBeInstanceOf(FlureeError);
    if (error instanceof FlureeError) {
      expect(error.message).toMatch(/db\/invalid-query/);
    }
  });
});
