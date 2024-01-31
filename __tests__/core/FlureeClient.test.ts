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

    it('throws error if host is not defined', () => {
      let error;
      try {
        new FlureeClient({
          host: '',
          port: 8080,
          ledger: 'fluree-client/client',
        });
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
    });

    it('throws error if ledger is not defined', () => {
      let error;
      try {
        new FlureeClient({
          host: 'localhost',
          port: 8080,
          ledger: '',
        });
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

    it('throws error if configre() updates without host or ledger', () => {
      const client = new FlureeClient({
        host: 'localhost',
        port: 8080,
        ledger: 'fluree-client/client',
      });
      let error;
      try {
        client.configure({
          host: '',
          ledger: 'fluree/client/newTest',
        });
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
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
  });
});
