import { FlureeClient } from '../../src';
import { verifyJWS } from '@fluree/crypto';
import { v4 as uuid } from 'uuid';
import { HttpError } from '../../src/core/Error';

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
    expect(error).toBeInstanceOf(HttpError);
    // if (error instanceof FlureeError) {
    //   expect(error.message).toMatch(/db\/invalid-query/);
    // }
  });

  it('can use sign() to sign a query', async () => {
    if (!process.env.TEST_PRIVATE_KEY) {
      fail('TEST_PRIVATE_KEY not defined');
    }
    if (!process.env.TEST_DID) {
      fail('TEST_DID not defined');
    }
    const client = await new FlureeClient({
      host: process.env.FLUREE_CLIENT_TEST_HOST,
      port: Number(process.env.FLUREE_CLIENT_TEST_PORT),
      ledger: 'fluree-client/sign-function',
      create: true,
      privateKey: process.env.TEST_PRIVATE_KEY,
    }).connect();
    const did = client.getDid();
    if (!did) {
      fail('DID not defined');
    }

    await client
      .transact({
        '@context': {
          f: 'https://ns.flur.ee/ledger#',
        },
        insert: [
          {
            '@id': 'ex:rootPolicy',
            '@type': ['f:Policy'],
            'f:targetNode': { '@id': 'f:allNodes' },
            'f:allow': [
              {
                '@id': 'ex:rootAccessAllow',
                'f:targetRole': { '@id': 'ex:rootRole' },
                'f:action': [{ '@id': 'f:view' }, { '@id': 'f:modify' }],
              },
            ],
          },
          {
            '@id': did,
            'f:role': { '@id': 'ex:rootRole' },
          },
        ],
      })
      .send();
    const response = await client
      .query({
        select: { did: ['*'] },
      })
      .sign()
      .send();
    expect(response).toBeDefined();
  });

  it('can sign messages by default if config.signMessages is true', async () => {
    if (!process.env.TEST_PRIVATE_KEY) {
      fail('TEST_PRIVATE_KEY not defined');
    }
    if (!process.env.TEST_DID) {
      fail('TEST_DID not defined');
    }
    const client = await new FlureeClient({
      host: process.env.FLUREE_CLIENT_TEST_HOST,
      port: Number(process.env.FLUREE_CLIENT_TEST_PORT),
      ledger: 'fluree-client/sign-messages',
      create: true,
      privateKey: process.env.TEST_PRIVATE_KEY,
    }).connect();

    client.configure({ signMessages: true }); // If this is set, messsages are signed by default

    const signedQuery = client
      .query({
        selectOne: { andrew: ['*'] },
      })
      .getSignedQuery();

    const verificationResult = verifyJWS(signedQuery);

    if (!verificationResult) {
      fail('Verification failed');
    }

    const { payload, pubkey } = verificationResult as {
      payload: string;
      pubkey: string;
    };

    const publicKey = client.getPublicKey();

    expect(pubkey).toBeDefined();
    expect(pubkey).toBe(publicKey);
    expect(payload).toBeDefined();
  });

  it('can return a query object', async () => {
    const client = await new FlureeClient({
      host: process.env.FLUREE_CLIENT_TEST_HOST,
      port: Number(process.env.FLUREE_CLIENT_TEST_PORT),
      ledger: uuid(),
      create: true,
    }).connect();

    const query = client.query({
      select: { freddy: ['*'] },
    });
    const queryObject = query.getQuery();
    expect(queryObject).toBeDefined();
    expect(queryObject).toMatchObject({ select: { freddy: ['*'] } });
  });

  it('throws an error if sign() is called without any privateKey', async () => {
    const client = await new FlureeClient({
      host: process.env.FLUREE_CLIENT_TEST_HOST,
      port: Number(process.env.FLUREE_CLIENT_TEST_PORT),
      ledger: 'fluree-client/sign-without-key-error-query',
      create: true,
    }).connect();

    let error;
    try {
      client
        .query({
          selectOne: { andrew: ['*'] },
        })
        .sign();
    } catch (e) {
      error = e;
    }
    expect(error).toBeDefined();
  });

  describe('context', () => {
    it('can handle empty contexts', async () => {
      const client = await new FlureeClient({
        host: process.env.FLUREE_CLIENT_TEST_HOST,
        port: Number(process.env.FLUREE_CLIENT_TEST_PORT),
        ledger: 'fluree-client/empty-context',
        create: true,
      }).connect();
      const queryInstance = client.query({
        '@context': { ex: 'http://example.org/' },
        where: { '@id': '?s' },
        select: '?s',
      });
      expect(queryInstance.query).toBeDefined();
      expect(queryInstance.query['@context']).toBeInstanceOf(Object);
      expect(queryInstance.query['@context']).toBeDefined();
      expect(JSON.stringify(queryInstance.query['@context'])).toBe(
        JSON.stringify({ ex: 'http://example.org/' }),
      );

      client.setContext({ ex: 'http://example.org/' });

      const queryInstance2 = client.query({
        '@context': {},
        where: { '@id': '?s' },
        select: '?s',
      });

      expect(queryInstance2.query).toBeDefined();
      expect(queryInstance2.query['@context']).toBeInstanceOf(Object);
      expect(queryInstance2.query['@context']).toBeDefined();
      expect(JSON.stringify(queryInstance2.query['@context'])).toBe(
        JSON.stringify({ ex: 'http://example.org/' }),
      );
    });
  });
});
