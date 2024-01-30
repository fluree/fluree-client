import { FlureeClient } from '../src/index';

describe('testContainer', () => {
  it('can connect', async () => {
    const host = process.env.FLUREE_CLIENT_TEST_HOST;
    const port = Number(process.env.FLUREE_CLIENT_TEST_PORT);
    if (!host) {
      fail('host not defined');
    }
    expect(port).toBeDefined();
    const client = new FlureeClient({
      host,
      port: port as number,
      ledger: 'fluree-client/test',
    });
    let error;
    try {
      await client.connect();
    } catch (e) {
      error = e;
    }
    expect(error).toBeUndefined();
  });

  it('can support a fluree instance', async () => {
    const host = process.env.FLUREE_CLIENT_TEST_HOST;
    const port = Number(process.env.FLUREE_CLIENT_TEST_PORT);
    if (!host) {
      fail('host not defined');
    }
    const client = new FlureeClient({
      host,
      port: port as number,
      ledger: 'fluree-client/test',
    });

    await client.connect();
    expect(client).toBeInstanceOf(FlureeClient);
  });
});
