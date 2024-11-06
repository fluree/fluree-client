import { FlureeClient } from '../../src';
import { ContextStatement } from '../../src/types/ContextTypes';

describe('FlureeClient Browser Tests', () => {
  let client: FlureeClient;

  beforeAll(async () => {
    const host = 'localhost';
    const port = 8095;
    const ledger = `test/browser-${Date.now()}`;
    client = await new FlureeClient({
      host,
      port,
      ledger,
      create: true,
    }).connect();
  });

  it('can instantiate FlureeClient in browser', () => {
    expect(client).toBeInstanceOf(FlureeClient);
    expect(client.config.host).toBe('localhost');
    expect(client.config.port).toBe(8095);
  });

  it('can handle browser-specific features', () => {
    // Test browser-specific crypto operations
    const keyPair = client.generateKeyPair();
    expect(keyPair).toBeDefined();

    const publicKey = client.getPublicKey();
    expect(publicKey).toBeDefined();
  });

  it('can handle context operations in browser', () => {
    const context: ContextStatement = {
      schema: 'http://schema.org/',
      ex: 'http://example.org/',
    };

    client.setContext(context);
    const initialContext = client.getContext();
    expect(initialContext).toBeDefined();
    expect(initialContext).toEqual(context);

    const newContext = {
      dc: 'http://purl.org/dc/elements/1.1/',
    };
    client.addToContext(newContext);

    const updatedContext = client.getContext();
    expect(updatedContext).toBeDefined();
    expect(updatedContext).toEqual({
      ...context,
      ...newContext,
    });
  });

  it('can transact data in browser', async () => {
    const newClient = await new FlureeClient({
      host: 'localhost',
      port: 8095,
      ledger: 'test/browser-transact',
      create: true,
    }).connect();
    const response = await newClient
      .transact({
        insert: {
          message: 'success',
        },
      })
      .send();
    expect(response).toBeDefined();
  });

  it('can query data in browser', async () => {
    const client = await new FlureeClient({
      host: 'localhost',
      port: 8095,
      ledger: 'test/browser-query',
      create: true,
    }).connect();

    await client
      .transact({
        '@context': {
          ex: 'http://example.org/',
        },
        insert: [
          {
            '@id': 'ex:alice',
            '@type': 'ex:Person',
            'ex:name': 'Alice',
            'ex:age': 25,
          },
          {
            '@id': 'ex:bob',
            '@type': 'ex:Person',
            'ex:name': 'Bob',
            'ex:age': 35,
          },
        ],
      })
      .send();

    const data = await client
      .query({
        '@context': {
          ex: 'http://example.org/',
        },
        select: { '?s': ['*'] },
        where: {
          '@id': '?s',
          '@type': 'ex:Person',
        },
      })
      .send();

    expect(data).toBeDefined();
    if (!Array.isArray(data)) {
      fail('Data is not an array');
    }
    expect(data.length).toBe(2);
    expect(data[0]['@id']).toBeDefined();
    expect(data[0]['ex:name']).toBeDefined();
    expect(data[0]['ex:age']).toBeDefined();
    expect(data[0]['@id']).toEqual('ex:alice');
  });
});
