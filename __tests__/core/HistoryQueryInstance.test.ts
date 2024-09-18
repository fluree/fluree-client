import { FlureeClient } from '../../src';
import { verifyJWS } from '@fluree/crypto';
import { v4 as uuid } from 'uuid';
import { ApplicationError, HttpError } from '../../src/core/Error';

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
    expect(error).toBeInstanceOf(ApplicationError);
    if (error instanceof ApplicationError) {
      expect(error.message).toBe(
        'either the history or commit-details key is required',
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
    expect(error).toBeInstanceOf(HttpError);
    // if (error instanceof FlureeError) {
    //   expect(error.message).toMatch(/db\/invalid-query/);
    // }
  });

  it('can use sign() to sign a history query', async () => {
    if (!process.env.TEST_PRIVATE_KEY) {
      fail('TEST_PRIVATE_KEY not defined');
    }
    if (!process.env.TEST_DID) {
      fail('TEST_DID not defined');
    }
    const client = await new FlureeClient({
      host: process.env.FLUREE_CLIENT_TEST_HOST,
      port: Number(process.env.FLUREE_CLIENT_TEST_PORT),
      ledger: 'fluree-client/sign-function-history',
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
      .history({
        'commit-details': true,
        t: { at: 'latest' },
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
      ledger: 'fluree-client/sign-messages-history',
      create: true,
      privateKey: process.env.TEST_PRIVATE_KEY,
    }).connect();

    client.configure({ signMessages: true }); // If this is set, messsages are signed by default

    const signedQuery = client
      .history({
        history: 'andrew',
        t: { at: 'latest' },
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
      ledger: 'fluree-client/sign-without-key-error-query-history',
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
});
