import { FlureeClient } from '../../src';
import { FlureeError } from '../../src/core/FlureeError';

describe('QueryInstance', () => {
  it('throws error on invalid query', async () => {
    const client = await new FlureeClient({
      host: process.env.FLUREE_CLIENT_TEST_HOST,
      port: Number(process.env.FLUREE_CLIENT_TEST_PORT),
      ledger: 'fluree-client/query',
      create: true,
    }).connect();
    let error;
    try {
      await client
        .query({
          selectOne: '?s',
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
