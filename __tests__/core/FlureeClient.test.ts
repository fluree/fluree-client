import 'jest-extended';
import { FlureeClient } from '../../src';
import { v4 as uuid } from 'uuid';
import { TransactionInstance } from '../../src/core/TransactionInstance';
import {
  WhereObject,
  WhereStatement,
  WhereOperation,
} from '../../src/types/WhereTypes';
import { DeleteObject } from '../../src/types/TransactionTypes';

describe('FlureeClient', () => {
  describe('constructor', () => {
    it('can instanitate FlureeClient', () => {
      const client = new FlureeClient({
        host: 'localhost',
        port: 8080,
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
        }).connect();
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
    });

    it('throws error if host or port are defined when isFlureeHosted is true', async () => {
      let hostError, portError;
      try {
        await new FlureeClient({
          host: 'localhost',
          isFlureeHosted: true,
        }).connect();
      } catch (e) {
        hostError = e;
      }

      try {
        await new FlureeClient({
          port: 8090,
          isFlureeHosted: true,
        }).connect();
      } catch (e) {
        portError = e;
      }

      expect(hostError).toBeDefined();
      expect(portError).toBeDefined();
    });

    it('warns if isFlureeHosted is true but no apiKey is set', async () => {
      const logSpy = jest.spyOn(console, 'warn').mockImplementation();
      new FlureeClient({
        isFlureeHosted: true,
      });
      expect(logSpy).toHaveBeenCalled();
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
        port: 8090,
      });
      const configuredClient = client.configure({
        port: 8080,
      });
      expect(configuredClient).toBeInstanceOf(FlureeClient);
      expect(configuredClient.config.port).toEqual(8080);
    });

    it('can update context with configure', () => {
      const client = new FlureeClient({
        host: 'localhost',
        port: 8080,
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

    it('can connect to a fluree-hosted ledger', async () => {
      const client = new FlureeClient({
        isFlureeHosted: true,
        ledger: process.env.TEST_NEXUS_LEDGER,
        apiKey: process.env.TEST_API_KEY,
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

    it('can create a ledger with a privateKey if signMessages is true', async () => {
      const ledger = uuid();
      const client = new FlureeClient({
        host: process.env.FLUREE_CLIENT_TEST_HOST,
        port: Number(process.env.FLUREE_CLIENT_TEST_PORT),
        ledger: 'fluree-client/test',
        privateKey: process.env.TEST_PRIVATE_KEY,
        signMessages: true,
      });
      await client.create(ledger);
      expect(client).toBeInstanceOf(FlureeClient);
      expect(client.config.ledger).toEqual(ledger);
      try {
        await client.connect();
      } catch (e) {
        console.error(e);
        fail(e);
      }
    });

    it('can optionally add a transaction to a create() call', async () => {
      const ledger = uuid();
      const client = new FlureeClient({
        host: process.env.FLUREE_CLIENT_TEST_HOST,
        port: Number(process.env.FLUREE_CLIENT_TEST_PORT),
        ledger: 'fluree-client/test',
      });
      await client.create(ledger, {
        '@context': {
          ex: 'http://example.org/',
        },
        insert: { '@id': 'ex:andrew', 'ex:name': 'Andrew' },
      });
      expect(client).toBeInstanceOf(FlureeClient);
      expect(client.config.ledger).toEqual(ledger);
      await client.connect();
      const data = await client
        .query({
          '@context': {
            ex: 'http://example.org/',
          },
          select: { '?s': ['*'] },
          where: {
            '@id': '?s',
            'ex:name': 'Andrew',
          },
        })
        .send();
      expect(data).toBeDefined();
      if (!Array.isArray(data)) {
        fail('data is not an array');
      }
      expect(data).toHaveLength(1);
      expect(data[0]['@id']).toBe('ex:andrew');
    });

    it('cannot create a ledger if isFlureeHosted is true', async () => {
      const ledger = uuid();
      let error;
      try {
        await new FlureeClient({
          isFlureeHosted: true,
          ledger,
          apiKey: process.env.TEST_API_KEY,
          create: true,
        }).connect();
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
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
    it('can create a transaction instance with a configured ledger', async () => {
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

    it('can create a transaction instance without a configured ledger if ledger is specified at transaction time', async () => {
      const client = await new FlureeClient({
        host: process.env.FLUREE_CLIENT_TEST_HOST,
        port: Number(process.env.FLUREE_CLIENT_TEST_PORT),
      });
      const transactionInstance = client.transact({
        ledger: 'fluree-client/test',
        insert: {
          message: 'success',
        },
      });
      expect(transactionInstance.getTransaction().ledger).toEqual(
        'fluree-client/test',
      );
      expect(transactionInstance).toBeInstanceOf(TransactionInstance);
    }, 20000);

    it('cannot create a transaction instance if neither a ledger is configured on client nor if ledger is specified at transaction time', async () => {
      const client = await new FlureeClient({
        host: process.env.FLUREE_CLIENT_TEST_HOST,
        port: Number(process.env.FLUREE_CLIENT_TEST_PORT),
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
    }, 20000);

    it('throws an error if connect() is called without specifying a ledger in either the config or in the connect call', async () => {
      const client = new FlureeClient({
        host: process.env.FLUREE_CLIENT_TEST_HOST,
        port: Number(process.env.FLUREE_CLIENT_TEST_PORT),
      });
      let error;
      try {
        await client.connect();
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();

      let error2;
      try {
        await client.connect('fluree-client/test');
      } catch (e) {
        error2 = e;
      }
      expect(error2).toBeUndefined();
      expect(client.config.ledger).toEqual('fluree-client/test');
    }, 20000);

    it('does not throw error if not connected', async () => {
      const client = new FlureeClient({
        host: 'localhost',
        port: 8080,
        ledger: 'fluree-client/test',
      });
      let error;
      try {
        client.transact({
          insert: {
            '@id': 'test-message',
            message: 'success',
          },
        });
      } catch (e) {
        error = e;
      }
      expect(error).toBeUndefined();

      let error2;
      try {
        client.upsert({
          '@id': 'test-message',
          message: 'even better success',
        });
      } catch (e) {
        error2 = e;
      }

      expect(error2).toBeUndefined();
    });

    it('can translate delete(id: string) into transactionInstance', async () => {
      const client = await new FlureeClient({
        host: process.env.FLUREE_CLIENT_TEST_HOST,
        port: Number(process.env.FLUREE_CLIENT_TEST_PORT),
        ledger: uuid(),
        create: true,
      });

      const deleteTransaction = client.delete('ex:freddy');
      const transactionBody = deleteTransaction.getTransaction();

      expect(deleteTransaction).toBeInstanceOf(TransactionInstance);
      expect(transactionBody).toHaveProperty('where');
      expect(transactionBody.where).toHaveLength(1);
      const whereStatement = transactionBody.where as Array<WhereObject>;
      expect(whereStatement[0]).toHaveProperty('@id');
      expect(whereStatement[0]['@id']).toEqual('ex:freddy');

      expect(transactionBody).toHaveProperty('delete');
      expect(transactionBody.delete).toHaveLength(1);
      const deleteStatement = transactionBody.where as Array<DeleteObject>;
      expect(deleteStatement[0]).toHaveProperty('@id');
      expect(deleteStatement[0]['@id']).toBe('ex:freddy');
    });

    it('can translate delete(id: string[]) into transactionInstance', async () => {
      const client = await new FlureeClient({
        host: process.env.FLUREE_CLIENT_TEST_HOST,
        port: Number(process.env.FLUREE_CLIENT_TEST_PORT),
        ledger: uuid(),
        create: true,
      }).connect();

      const deleteTransaction = client.delete(['ex:freddy', 'ex:letty']);
      const transactionBody = deleteTransaction.getTransaction();

      expect(deleteTransaction).toBeInstanceOf(TransactionInstance);
      expect(transactionBody).toHaveProperty('where');
      expect(transactionBody.where).toHaveLength(2);
      expect(transactionBody).toHaveProperty('delete');
      expect(transactionBody.delete).toHaveLength(2);
    });

    it('can translate delete() into transactionInstances with custom idAlias', async () => {
      const client = await new FlureeClient({
        host: process.env.FLUREE_CLIENT_TEST_HOST,
        port: Number(process.env.FLUREE_CLIENT_TEST_PORT),
        ledger: uuid(),
        create: true,
        defaultContext: [
          'https://ns.flur.ee/',
          {
            id: '@id',
          },
        ],
      }).connect();

      const deleteTransaction = client.delete(['ex:freddy', 'ex:letty']);
      const transactionBody = deleteTransaction.getTransaction();

      expect(transactionBody).toHaveProperty('where');
      const whereStatement = transactionBody.where as Array<WhereStatement>;
      expect(whereStatement[0]).toHaveProperty('id');
    });

    it('can effectively retract subjects from ledger when using delete()', async () => {
      const client = await new FlureeClient({
        host: process.env.FLUREE_CLIENT_TEST_HOST,
        port: Number(process.env.FLUREE_CLIENT_TEST_PORT),
        ledger: uuid(),
        create: true,
        defaultContext: {
          id: '@id',
          ex: 'http://example.org/',
        },
      }).connect();

      await client
        .transact({
          insert: [
            {
              id: 'ex:freddy',
              '@type': 'ex:Yeti',
              name: 'Freddy',
              friends: [{ id: 'ex:alice' }, { id: 'ex:letty' }],
            },
            {
              id: 'ex:alice',
              '@type': 'ex:Yeti',
              superHeroPower: 'flight',
              age: 25,
              friends: [{ id: 'ex:freddy' }],
            },
            {
              id: 'ex:letty',
              '@type': 'ex:Yeti',
              name: 'Leticia',
              age: 35,
            },
          ],
        })
        .send();

      const deleteTransaction = client.delete(['ex:alice', 'ex:letty']);

      const result = await deleteTransaction.send();
      expect(result).toBeDefined();

      const data = await client
        .query({
          select: { '?s': ['*'] },
          where: {
            id: '?s',
            '@type': 'ex:Yeti',
          },
        })
        .send();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const freddy = data.find((item: any) => item.id === 'ex:freddy');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const alice = data.find((item: any) => item.id === 'ex:alice');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const letty = data.find((item: any) => item.id === 'ex:letty');
      expect(freddy).toBeDefined();
      expect(alice).not.toBeDefined();
      expect(letty).not.toBeDefined();
      expect(freddy.friends).toHaveLength(2);
      expect(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        freddy.friends.map((f: any) => f.id).includes('ex:letty'),
      ).toBeTruthy();
      expect(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        freddy.friends.map((f: any) => f.id).includes('ex:alice'),
      ).toBeTruthy();
    });

    it('can translate upsert() into transactionInstances', async () => {
      const client = await new FlureeClient({
        host: process.env.FLUREE_CLIENT_TEST_HOST,
        port: Number(process.env.FLUREE_CLIENT_TEST_PORT),
        ledger: uuid(),
        create: true,
      }).connect();

      const upsertTransaction = client.upsert([
        {
          '@id': 'ex:freddy',
          name: 'Freddy the Yeti',
          favoriteNumbers: [4, 5],
          friends: [
            {
              '@id': 'ex:andrew',
              name: 'Andrew',
              friends: [{ '@id': 'ex:freddy' }],
            },
            { '@id': 'ex:alice' },
            { '@id': 'ex:letty', name: 'Letty' },
            { '@id': 'ex:bob' },
            { name: 'blank guy' },
          ],
        },
        {
          '@id': 'ex:alice',
          superHeroPower: 'mind reading',
          friends: { '@id': 'ex:freddy' },
        },
      ]);

      const transactionBody = upsertTransaction.getTransaction();

      expect(upsertTransaction).toBeInstanceOf(TransactionInstance);
      expect(transactionBody).toHaveProperty('where');
      expect(transactionBody).toHaveProperty('delete');
    });

    it('can translate upsert() into transactionInstances with custom idAlias', async () => {
      const client = await new FlureeClient({
        host: process.env.FLUREE_CLIENT_TEST_HOST,
        port: Number(process.env.FLUREE_CLIENT_TEST_PORT),
        ledger: uuid(),
        create: true,
        defaultContext: [
          'https://ns.flur.ee/',
          {
            id: '@id',
          },
        ],
      }).connect();

      const upsertTransaction = client.upsert([
        {
          id: 'ex:freddy',
          name: 'Freddy the Yeti',
          favoriteNumbers: [4, 5],
          friends: [
            {
              id: 'ex:andrew',
              name: 'Andrew',
              friends: [{ id: 'ex:freddy' }],
            },
            { id: 'ex:alice' },
            { id: 'ex:letty', name: 'Letty' },
            { id: 'ex:bob' },
          ],
        },
        {
          id: 'ex:alice',
          superHeroPower: 'mind reading',
          friends: { id: 'ex:freddy' },
        },
      ]);

      const transactionBody = upsertTransaction.getTransaction();

      expect(transactionBody).toHaveProperty('where');
      if (!transactionBody.where) {
        fail('transactionBody.where is not defined');
      }
      const whereStatement = transactionBody.where as Array<WhereStatement>;

      const optionalClause = whereStatement[0] as WhereOperation;

      expect(optionalClause).toBeInstanceOf(Array);

      expect(optionalClause[1]).toHaveProperty('id');
    });

    it('can accurately adjust data state when using upsert()', async () => {
      const client = await new FlureeClient({
        host: process.env.FLUREE_CLIENT_TEST_HOST,
        port: Number(process.env.FLUREE_CLIENT_TEST_PORT),
        ledger: uuid(),
        create: true,
        defaultContext: {
          ex: 'http://example.org/',
        },
      }).connect();

      await client
        .transact({
          insert: [
            {
              '@id': 'ex:freddy',
              '@type': 'ex:Person',
              name: 'Freddy',
              age: 30,
              favoriteNumbers: [1, 2, 3],
              friends: [{ '@id': 'ex:alice' }, { '@id': 'ex:letty' }],
            },
            {
              '@id': 'ex:alice',
              '@type': 'ex:Person',
              superHeroPower: 'flight',
              age: 25,
              friends: [{ '@id': 'ex:freddy' }, { '@id': 'ex:bob' }],
            },
            {
              '@id': 'ex:bob',
              '@type': 'ex:Person',
              name: 'Bob',
              age: 35,
              friends: [{ '@id': 'ex:freddy' }, { '@id': 'ex:alice' }],
            },
            {
              '@id': 'ex:letty',
              '@type': 'ex:Person',
              name: 'Leticia',
              age: 35,
            },
          ],
        })
        .send();

      const upsertTransaction = client.upsert([
        {
          '@id': 'ex:freddy',
          name: 'Freddy the Yeti',
          favoriteNumbers: [4, 5],
          friends: [
            {
              '@id': 'ex:andrew',
              '@type': 'ex:Person',
              name: 'Andrew',
              friends: [{ '@id': 'ex:freddy' }],
            },
            { '@id': 'ex:letty', name: 'Letty' },
            { '@id': 'ex:bob' },
          ],
        },
        {
          '@id': 'ex:alice',
          superHeroPower: 'mind reading',
          friends: { '@id': 'ex:freddy' },
        },
      ]);

      const result = await upsertTransaction.send();
      expect(result).toBeDefined();

      const data = await client
        .query({
          select: { '?s': ['*'] },
          where: {
            '@id': '?s',
            '@type': 'ex:Person',
          },
        })
        .send();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const freddy = data.find((item: any) => item['@id'] === 'ex:freddy');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const alice = data.find((item: any) => item['@id'] === 'ex:alice');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bob = data.find((item: any) => item['@id'] === 'ex:bob');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const letty = data.find((item: any) => item['@id'] === 'ex:letty');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const andrew = data.find((item: any) => item['@id'] === 'ex:andrew');
      expect(freddy).toBeDefined();
      expect(alice).toBeDefined();
      expect(bob).toBeDefined();
      expect(letty).toBeDefined();
      expect(andrew).toBeDefined();
      expect(freddy.favoriteNumbers.includes(4)).toBeTruthy();
      expect(freddy.favoriteNumbers.includes(5)).toBeTruthy();
      expect(freddy.favoriteNumbers.includes(1)).toBeFalsy();
      expect(letty.name).toEqual('Letty');
      expect(andrew.name).toEqual('Andrew');
      expect(bob.name).toEqual('Bob');
      expect(andrew.friends['@id']).toEqual('ex:freddy');
    });

    it('can handle blank nodes correctly with upsert', async () => {
      const client = await new FlureeClient({
        host: process.env.FLUREE_CLIENT_TEST_HOST,
        port: Number(process.env.FLUREE_CLIENT_TEST_PORT),
        ledger: uuid(),
        create: true,
      }).connect();

      const upsertTxn = client.upsert({
        '@id': 'andrew',
        friends: [
          {
            '@id': 'alice',
            name: 'alice',
          },
          { '@id': 'bob' },
          { name: 'blank guy' },
        ],
      });

      let error;
      try {
        await upsertTxn.send();
      } catch (e) {
        error = e;
      }

      expect(error).toBeUndefined();
    });
  });

  describe('query()', () => {
    it('does not throw error if not connected', async () => {
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
      expect(error).toBeUndefined();
    });

    it('returns expected query results', async () => {
      const client = await new FlureeClient({
        host: process.env.FLUREE_CLIENT_TEST_HOST,
        port: Number(process.env.FLUREE_CLIENT_TEST_PORT),
        ledger: uuid(),
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
      expect(data).toHaveLength(2);
      expect(data[0]['@id']).toBeDefined();
      expect(data[0]['ex:name']).toBeDefined();
      expect(data[0]['ex:age']).toBeDefined();
      expect(data[0]['@id']).toEqual('ex:alice');
    });
  });

  describe('history()', () => {
    it('does not throw error if not connected', async () => {
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
      expect(error).toBeUndefined();
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
              '@type': ['f:AccessPolicy', 'ex:UserPolicy'],
              'f:action': [{ '@id': 'f:view' }],
              'f:query': {
                '@type': '@json',
                '@value': {},
              },
            },
            {
              '@id': 'ex:secretsPolicy',
              '@type': ['f:AccessPolicy', 'ex:UserPolicy'],
              'f:onProperty': {
                '@id': 'ex:secret',
              },
              'f:action': [{ '@id': 'f:view' }],
              'f:query': {
                '@type': '@json',
                '@value': {
                  '@context': {
                    f: 'https://ns.flur.ee/ledger#',
                    ex: 'http://example.org/',
                  },
                  where: {
                    '@id': '?$identity',
                    'ex:user': {
                      '@id': '?$this',
                    },
                  },
                },
              },
            },
            {
              '@id': did,
              'ex:user': {
                '@id': 'ex:alice',
              },
              'f:policyClass': {
                '@id': 'ex:UserPolicy',
              },
            },
          ],
        })
        .send();

      const txnBody = {
        insert: [
          {
            '@id': 'ex:alice',
            'ex:secret': "alice's new secret",
          },
        ],
      };

      const signedTransaction = client.transact(txnBody).sign();

      let result, error;

      try {
        result = await signedTransaction.send();
      } catch (e) {
        error = e;
      }

      console.log('error', error);

      expect(error).toBeDefined();
      expect(result).toBeUndefined();

      await client
        .transact({
          insert: {
            '@id': 'ex:secretsPolicy',
            'f:action': {
              '@id': 'f:modify',
            },
          },
        })
        .send();

      const signedTransaction2 = client.transact(txnBody).sign();

      let result2, error2;

      try {
        result2 = await signedTransaction2.send();
      } catch (e) {
        error2 = e;
      }

      expect(error2).toBeUndefined();
      expect(result2).toBeDefined();
    });

    it('can also transact sign messages to a fluree-hosted ledger', async () => {
      const client = await new FlureeClient({
        isFlureeHosted: true,
        ledger: process.env.TEST_NEXUS_LEDGER,
        apiKey: process.env.TEST_API_KEY,
        privateKey:
          '509553eece84d5a410f1012e8e19e84e938f226aa3ad144e2d12f36df0f51c1e',
      }).connect();

      client.setContext({
        f: 'https://ns.flur.ee/ledger#',
        ex: 'http://example.org/',
      });

      const did = client.getDid();

      if (!did) {
        fail('DID not defined');
      }

      // data, policy, and identity are already stored in Fluree Hosted:
      // https://data.flur.ee/jwhite/datasets/fluree-client-test ("fluree-jld/387028092978323")

      // TODO: uncomment this when Fluree Hosted can handle an upsert of Policy data (and don't forget to make this an upsert)
      // await client
      //   .transact({
      //     '@context': {
      //       'f:equals': { '@container': '@list' },
      //     },
      //     insert: [
      //       {
      //         '@id': 'ex:alice',
      //         '@type': 'ex:User',
      //         'ex:secret': "alice's secret",
      //       },
      //       {
      //         '@id': 'ex:bob',
      //         '@type': 'ex:User',
      //         'ex:secret': "bob's secret",
      //       },
      //       {
      //         '@id': 'ex:userPolicy',
      //         '@type': ['f:Policy'],
      //         'f:targetClass': {
      //           '@id': 'ex:User',
      //         },
      //         'f:allow': [
      //           {
      //             '@id': 'ex:globalViewAllow',
      //             'f:targetRole': {
      //               '@id': 'ex:userRole',
      //             },
      //             'f:action': [
      //               {
      //                 '@id': 'f:view',
      //               },
      //             ],
      //           },
      //         ],
      //         'f:property': [
      //           {
      //             '@id': 'ex:property1',
      //             'f:path': {
      //               '@id': 'ex:secret',
      //             },
      //             'f:allow': [
      //               {
      //                 '@id': 'ex:secretsRule',
      //                 'f:targetRole': {
      //                   '@id': 'ex:userRole',
      //                 },
      //                 'f:action': [
      //                   {
      //                     '@id': 'f:view',
      //                   },
      //                   {
      //                     '@id': 'f:modify',
      //                   },
      //                 ],
      //                 'f:equals': [
      //                   {
      //                     '@id': 'f:$identity',
      //                   },
      //                   {
      //                     '@id': 'ex:user',
      //                   },
      //                 ],
      //               },
      //             ],
      //           },
      //         ],
      //       },
      //       {
      //         '@id': did,
      //         'ex:user': {
      //           '@id': 'ex:alice',
      //         },
      //         'f:role': {
      //           '@id': 'ex:userRole',
      //         },
      //       },
      //     ],
      //   })
      //   .send();

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

      if (error) {
        console.error(error);
      }

      expect(error).toBeUndefined();
      expect(result).toBeDefined();
    });

    it('can also query with signed messages to a fluree-hosted ledger', async () => {
      const client = await new FlureeClient({
        isFlureeHosted: true,
        ledger: process.env.TEST_NEXUS_LEDGER,
        apiKey: process.env.TEST_API_KEY,
        privateKey:
          '509553eece84d5a410f1012e8e19e84e938f226aa3ad144e2d12f36df0f51c1e',
      }).connect();

      client.setContext({
        f: 'https://ns.flur.ee/ledger#',
        ex: 'http://example.org/',
      });

      const did = client.getDid();

      if (!did) {
        fail('DID not defined');
      }

      // data, policy, and identity are already stored in Fluree Hosted:
      // https://data.flur.ee/jwhite/datasets/fluree-client-test ("fluree-jld/387028092978323")

      // TODO: uncomment this when Fluree Hosted can handle an upsert of Policy data (and don't forget to make this an upsert)
      // await client
      //   .transact({
      //     '@context': {
      //       'f:equals': { '@container': '@list' },
      //     },
      //     insert: [
      //       {
      //         '@id': 'ex:freddy',
      //         '@type': 'ex:Yeti',
      //         'ex:yetiSecret': "freddy's secret",
      //       },
      //       {
      //         '@id': 'ex:letty',
      //         '@type': 'ex:Yeti',
      //         'ex:yetiSecret': "letty's secret",
      //       },
      //       {
      //         '@id': 'ex:yetiPolicy',
      //         '@type': ['f:Policy'],
      //         'f:targetClass': {
      //           '@id': 'ex:Yeti',
      //         },
      //         'f:allow': [
      //           {
      //             '@id': 'ex:globalViewAllowForYetis',
      //             'f:targetRole': {
      //               '@id': 'ex:yetiRole',
      //             },
      //             'f:action': [
      //               {
      //                 '@id': 'f:view',
      //               },
      //             ],
      //           },
      //         ],
      //         'f:property': [
      //           {
      //             '@id': 'ex:property2',
      //             'f:path': {
      //               '@id': 'ex:yetiSecret',
      //             },
      //             'f:allow': [
      //               {
      //                 '@id': 'ex:yetiSecretsRule',
      //                 'f:targetRole': {
      //                   '@id': 'ex:yetiRole',
      //                 },
      //                 'f:action': [
      //                   {
      //                     '@id': 'f:view',
      //                   },
      //                   {
      //                     '@id': 'f:modify',
      //                   },
      //                 ],
      //                 'f:equals': [
      //                   {
      //                     '@id': 'f:$identity',
      //                   },
      //                   {
      //                     '@id': 'ex:yeti',
      //                   },
      //                 ],
      //               },
      //             ],
      //           },
      //         ],
      //       },
      //       {
      //         '@id': did,
      //         'ex:yeti': {
      //           '@id': 'ex:freddy',
      //         },
      //         'f:role': {
      //           '@id': 'ex:yetiRole',
      //         },
      //       },
      //     ]
      //   })
      //   .send();

      const signedQuery = client
        .query({
          where: {
            '@id': '?s',
            'ex:secret': '?secret',
          },
          select: '?secret',
        })
        .sign();

      let result, error;

      try {
        result = await signedQuery.send();
      } catch (e) {
        error = e;
      }

      expect(error).toBeUndefined();
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain("alice's secret");
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
        JSON.stringify(context),
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
        ]),
      );
    });
  });
});
