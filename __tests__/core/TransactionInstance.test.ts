import { FlureeClient } from '../../src';
import flureeCrypto from '@fluree/crypto';
const { verifyJWS } = flureeCrypto;
import { mergeContexts } from '../../src/utils/contextHandler';

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

  it('throws error on invalid transaction on fluree-hosted', async () => {
    const client = await new FlureeClient({
      isFlureeHosted: true,
      ledger: process.env.TEST_NEXUS_LEDGER,
      apiKey: process.env.TEST_API_KEY,
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

  describe('signing', () => {
    it('can use sign() to sign a transaction', async () => {
      if (!process.env.TEST_PRIVATE_KEY) {
        fail('TEST_PRIVATE_KEY not defined');
      }
      if (!process.env.TEST_DID) {
        fail('TEST_DID not defined');
      }
      const client = await new FlureeClient({
        host: process.env.FLUREE_CLIENT_TEST_HOST,
        port: Number(process.env.FLUREE_CLIENT_TEST_PORT),
        ledger: 'fluree-client/sign-function-transact',
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
            ex: 'http://example.org/',
          },
          insert: [
            {
              '@id': 'ex:rootPolicy',
              '@type': ['f:AccessPolicy', 'ex:RootPolicy'],
              'f:action': [{ '@id': 'f:view' }, { '@id': 'f:modify' }],
              'f:query': {
                '@type': '@json',
                '@value': {},
              },
            },
            {
              '@id': did,
              'f:policyClass': { '@id': 'ex:RootPolicy' },
            },
          ],
        })
        .send();
      const response = await client
        .transact({
          insert: {
            message: 'success',
          },
        })
        .sign()
        .send();
      expect(response).toBeDefined();
    }, 20000);

    it('can sign messages by default if config.signMessages is true', async () => {
      const privateKey = process.env.TEST_PRIVATE_KEY;
      const client = await new FlureeClient({
        host: process.env.FLUREE_CLIENT_TEST_HOST,
        port: Number(process.env.FLUREE_CLIENT_TEST_PORT),
        ledger: 'fluree-client/sign-messages-config',
        create: true,
        privateKey,
      }).connect();

      client.configure({ signMessages: true }); // If this is set, messsages are signed by default

      const signedTransaction = client
        .transact({
          insert: {
            message: 'success',
          },
        })
        .getSignedTransaction();

      const verificationResult = verifyJWS(signedTransaction);

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

    it('throws an error if sign() is called without any privateKey', async () => {
      const client = await new FlureeClient({
        host: process.env.FLUREE_CLIENT_TEST_HOST,
        port: Number(process.env.FLUREE_CLIENT_TEST_PORT),
        ledger: 'fluree-client/sign-messages-error',
        create: true,
      }).connect();

      let error;
      try {
        client
          .transact({
            insert: {
              message: 'success',
            },
          })
          .sign();
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
    });
  });

  describe('context', () => {
    it('can merge contexts from the config and the transaction', async () => {
      const defaultContext = {
        f: 'https://ns.flur.ee/ledger#',
      };
      const client = await new FlureeClient({
        host: process.env.FLUREE_CLIENT_TEST_HOST,
        port: Number(process.env.FLUREE_CLIENT_TEST_PORT),
        ledger: 'transaction/merge-contexts',
        create: true,
        defaultContext,
      }).connect();
      const context = [
        'https://ns.flur.ee',
        {
          f: 'https://ns.flur.ee/ledger#',
        },
      ];
      const transactionInstance = client.transact({
        '@context': context,
        insert: {
          message: 'success',
        },
      });
      const transactionBody = transactionInstance.getTransaction();
      expect(transactionBody['@context']).toBeDefined();

      expect(JSON.stringify(transactionBody['@context'])).toBe(
        JSON.stringify(mergeContexts(defaultContext, context)),
      );
    });

    it('can handle empty contexts', async () => {
      const client = await new FlureeClient({
        host: process.env.FLUREE_CLIENT_TEST_HOST,
        port: Number(process.env.FLUREE_CLIENT_TEST_PORT),
        ledger: 'fluree-client/empty-context-transact',
        create: true,
      }).connect();
      const transactionInstance = client.transact({
        '@context': { ex: 'http://example.org/' },
        insert: {
          message: 'success',
        },
      });
      expect(transactionInstance.getTransaction()).toBeDefined();
      expect(transactionInstance.getTransaction()['@context']).toBeInstanceOf(
        Object,
      );
      expect(transactionInstance.getTransaction()['@context']).toBeDefined();
      expect(
        JSON.stringify(transactionInstance.getTransaction()['@context']),
      ).toBe(JSON.stringify({ ex: 'http://example.org/' }));

      client.setContext('http://example.org/');

      const transactionInstance2 = client.transact({
        insert: {
          message: 'success',
        },
      });

      expect(transactionInstance2.getTransaction()).toBeDefined();
      expect(transactionInstance2.getTransaction()['@context']).toBeDefined();
      expect(
        JSON.stringify(transactionInstance2.getTransaction()['@context']),
      ).toBe(JSON.stringify('http://example.org/'));
    });
  });
});
