import { FlureeClient } from '../../src';

describe('TransactionInstance', () => {
  it('can send a transaction', async () => {
    const client = await new FlureeClient({
      host: process.env.FLUREE_CLIENT_TEST_HOST,
      port: Number(process.env.FLUREE_CLIENT_TEST_PORT),
      ledger: 'fluree-client/transaction',
      create: true,
    }).connect();
    const response = await client
      .transact({
        insert: {
          message: 'success',
        },
      })
      .send();
    console.log(JSON.stringify(response, null, 2));
    expect(response).toBeDefined();
  });

  it('throws error on invalid transaction', async () => {
    const client = await new FlureeClient({
      host: process.env.FLUREE_CLIENT_TEST_HOST,
      port: Number(process.env.FLUREE_CLIENT_TEST_PORT),
      ledger: 'fluree-client/transaction2',
      create: true,
    }).connect();
    let error;
    try {
      await client
        .transact({
          delete: {
            '@id': '?s',
          },
        })
        .send();
    } catch (e) {
      error = e;
    }
    expect(error).toBeDefined();
  });
});
