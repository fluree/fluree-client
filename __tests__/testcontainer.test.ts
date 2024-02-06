import { FlureeClient } from '../src/index';
import { v4 as uuid } from 'uuid';

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
      ledger: uuid(),
      create: true,
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
      ledger: uuid(),
      create: true,
    });

    await client.connect();
    expect(client).toBeInstanceOf(FlureeClient);
  });
});
