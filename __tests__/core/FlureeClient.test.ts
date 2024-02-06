import { FlureeClient } from '../../src';
import { v4 as uuid } from 'uuid';
import { TransactionInstance } from '../../src/core/TransactionInstance';

describe('FlureeClient', () => {
  describe('constructor', () => {
    it('can instanitate FlureeClient', () => {
      const client = new FlureeClient({
        host: 'localhost',
        port: 8080,
        ledger: 'fluree-client/client',
      });
      expect(client).toBeInstanceOf(FlureeClient);
    });

    it('can instantiate FlureeClient without any config options', () => {
      const client = new FlureeClient();
      expect(client).toBeInstanceOf(FlureeClient);
    });

    it('throws error if host is not defined on connection attempt', async () => {
      let error;
      try {
        await new FlureeClient({
          port: 8080,
          ledger: 'fluree-client/client',
        }).connect();
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
    });

    it('throws error if ledger is not defined on connection attempt', async () => {
      let error;
      try {
        await new FlureeClient({
          host: 'localhost',
          port: 8080,
        }).connect();
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
    });
  });

  describe('configure()', () => {
    it('can configure FlureeClient', () => {
      const client = new FlureeClient({
        host: 'localhost',
        port: 8080,
        ledger: 'fluree-client/test',
      });
      const configuredClient = client.configure({
        ledger: 'fluree-client/newTest',
      });
      expect(configuredClient).toBeInstanceOf(FlureeClient);
      expect(configuredClient.config.ledger).toEqual('fluree-client/newTest');
    });

    it('can update context with configure', () => {
      const client = new FlureeClient({
        host: 'localhost',
        port: 8080,
        ledger: 'fluree-client/test',
        defaultContext: 'https://ns.flur.ee/ledger#',
      });
      const configuredClient = client.configure({
        defaultContext: {
          schema: 'http://schema.org/',
        },
      });
      expect(configuredClient).toBeInstanceOf(FlureeClient);
      expect(configuredClient.config.defaultContext).toEqual([
        'https://ns.flur.ee/ledger#',
        {
          schema: 'http://schema.org/',
        },
      ]);
    });
  });

  describe('connect()', () => {
    it('can create a ledger on connect()', async () => {
      const client = new FlureeClient({
        host: process.env.FLUREE_CLIENT_TEST_HOST,
        port: Number(process.env.FLUREE_CLIENT_TEST_PORT),
        ledger: uuid(),
        create: true,
      });
      await client.connect();
      expect(client).toBeInstanceOf(FlureeClient);
    });

    it('throws error if ledger does not exist on connect()', async () => {
      const client = new FlureeClient({
        host: process.env.FLUREE_CLIENT_TEST_HOST,
        port: Number(process.env.FLUREE_CLIENT_TEST_PORT),
        ledger: uuid(),
      });
      let error;
      try {
        await client.connect();
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
    }, 15000);
  });

  describe('create()', () => {
    it('can create a ledger on create()', async () => {
      const ledger = uuid();
      const client = new FlureeClient({
        host: process.env.FLUREE_CLIENT_TEST_HOST,
        port: Number(process.env.FLUREE_CLIENT_TEST_PORT),
        ledger: 'fluree-client/test',
      });
      await client.create(ledger);
      expect(client).toBeInstanceOf(FlureeClient);
      expect(client.config.ledger).toEqual(ledger);
    });

    it('throws error if ledger already exists on create()', async () => {
      const client = await new FlureeClient({
        host: process.env.FLUREE_CLIENT_TEST_HOST,
        port: Number(process.env.FLUREE_CLIENT_TEST_PORT),
        ledger: 'fluree-client/test',
        create: true,
      }).connect();
      let error;
      try {
        await client.create('fluree-client/test');
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
    }, 15000);
  });

  describe('transact()', () => {
    it('can create a transaction instance', async () => {
      const client = await new FlureeClient({
        host: process.env.FLUREE_CLIENT_TEST_HOST,
        port: Number(process.env.FLUREE_CLIENT_TEST_PORT),
        ledger: 'fluree-client/test',
      }).connect();
      const transactionInstance = client.transact({
        insert: {
          message: 'success',
        },
      });
      expect(transactionInstance.config).toEqual(client.config);
      expect(transactionInstance).toBeInstanceOf(TransactionInstance);
    }, 20000);

    it('throws error if not connected', async () => {
      const client = new FlureeClient({
        host: 'localhost',
        port: 8080,
        ledger: 'fluree-client/test',
      });
      let error;
      try {
        client.transact({
          insert: {
            message: 'success',
          },
        });
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
    });
  });

  describe('query()', () => {
    it('throws error if not connected', async () => {
      const client = new FlureeClient({
        host: 'localhost',
        port: 8080,
        ledger: 'fluree-client/test',
      });
      let error;
      try {
        client.query({
          selectOne: '?s',
        });
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
    });
  });

  describe('history()', () => {
    it('throws error if not connected', async () => {
      const client = new FlureeClient({
        host: 'localhost',
        port: 8080,
        ledger: 'fluree-client/test',
      });
      let error;
      try {
        client.history({
          'commit-details': true,
          t: { at: 'latest' },
        });
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
    });
  });

  describe('signing messages', () => {
    it('can generate a keypair', () => {
      const client = new FlureeClient({
        host: 'localhost',
        port: 8080,
        ledger: 'fluree-client/test',
      });
      client.generateKeyPair();
      const publicKey = client.getPublicKey();
      expect(publicKey).toBeTruthy();
    });

    it('can return a privateKey', () => {
      const privateKey =
        'fef21a1f4b65618ed2e8f5b2f37a2d6a0c4f0f816e656910253e81b1078fffd6';

      const client = new FlureeClient({
        host: 'localhost',
        port: 8080,
        ledger: 'fluree-client/test',
        privateKey,
      });

      const privateKeyFromClient = client.getPrivateKey();

      expect(privateKeyFromClient).toBe(privateKey);
    });

    it('can return a did from a keypair', () => {
      const privateKey = process.env.TEST_PRIVATE_KEY || '';
      const did = process.env.TEST_DID || '';
      const client = new FlureeClient({
        host: 'localhost',
        port: 8080,
        ledger: 'fluree-client/test',
        privateKey,
      });
      const didFromKey = client.getDid();
      expect(didFromKey).toBe(did);
    });
    it('throws an error if signMessages = true and no privateKey is provided', () => {
      let error;

      try {
        new FlureeClient({
          host: 'localhost',
          port: 8080,
          ledger: 'fluree-client/client-sign-messages-error',
          signMessages: true,
          create: true,
        });
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
    });

    it('can successfully transact a signed message when policy is appropriate', async () => {
      const client = new FlureeClient({
        // host: 'localhost',
        // port: 58090,
        host: process.env.FLUREE_CLIENT_TEST_HOST,
        port: Number(process.env.FLUREE_CLIENT_TEST_PORT),
        ledger: uuid(),
        create: true,
        privateKey:
          '509553eece84d5a410f1012e8e19e84e938f226aa3ad144e2d12f36df0f51c1e',
      });

      await client.connect();

      client.setContext({
        f: 'https://ns.flur.ee/ledger#',
        ex: 'http://example.org/',
      });

      const did = client.getDid();

      if (!did) {
        fail('DID not defined');
      }

      await client
        .transact({
          '@context': {
            'f:equals': { '@container': '@list' },
          },
          insert: [
            {
              '@id': 'ex:alice',
              '@type': 'ex:User',
              'ex:secret': "alice's secret",
            },
            {
              '@id': 'ex:bob',
              '@type': 'ex:User',
              'ex:secret': "bob's secret",
            },
            {
              '@id': 'ex:userPolicy',
              '@type': ['f:Policy'],
              'f:targetClass': {
                '@id': 'ex:User',
              },
              'f:allow': [
                {
                  '@id': 'ex:globalViewAllow',
                  'f:targetRole': {
                    '@id': 'ex:userRole',
                  },
                  'f:action': [
                    {
                      '@id': 'f:view',
                    },
                  ],
                },
              ],
              'f:property': [
                {
                  'f:path': {
                    '@id': 'ex:secret',
                  },
                  'f:allow': [
                    {
                      '@id': 'ex:secretsRule',
                      'f:targetRole': {
                        '@id': 'ex:userRole',
                      },
                      'f:action': [
                        {
                          '@id': 'f:view',
                        },
                        {
                          '@id': 'f:modify',
                        },
                      ],
                      'f:equals': [
                        {
                          '@id': 'f:$identity',
                        },
                        {
                          '@id': 'ex:user',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              '@id': did,
              'ex:user': {
                '@id': 'ex:alice',
              },
              'f:role': {
                '@id': 'ex:userRole',
              },
            },
          ],
        })
        .send();

      const signedTransaction = client
        .transact({
          insert: [
            {
              '@id': 'ex:alice',
              'ex:secret': "alice's new secret",
            },
          ],
        })
        .sign();

      let result, error;

      try {
        result = await signedTransaction.send();
      } catch (e) {
        error = e;
      }

      expect(error).toBeUndefined();
      expect(result).toBeDefined();
    });
  });

  describe('context', () => {
    it('can set a context', () => {
      const client = new FlureeClient({
        host: 'localhost',
        port: 8080,
        ledger: 'fluree-client/test',
      });
      const context = [
        'https://ns.flur.ee',
        {
          f: 'https://ns.flur.ee/ledger#',
        },
      ];
      client.setContext(context);
      expect(JSON.stringify(client.config.defaultContext)).toEqual(
        JSON.stringify(context)
      );
    });

    it('can add to context', () => {
      const client = new FlureeClient({
        host: 'localhost',
        port: 8080,
        ledger: 'fluree-client/test',
      });
      client.addToContext('https://ns.flur.ee/ledger#');
      client.addToContext({
        schema: 'http://schema.org/',
      });
      expect(JSON.stringify(client.getContext())).toEqual(
        JSON.stringify([
          'https://ns.flur.ee/ledger#',
          {
            schema: 'http://schema.org/',
          },
        ])
      );
    });
  });
});
