import { FlureeClient } from '../../src';
import { verifyJWS } from '@fluree/crypto';

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

  describe('signing', () => {
    // TODO: Need to speak with Dan to understand how to test this
    it.skip('can use sign() to sign a transaction', async () => {
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
      await client
        .transact({
          '@context': [
            'https://ns.flur.ee',
            {
              f: 'https://ns.flur.ee/ledger#',
            },
          ],
          insert: {
            '@id': process.env.TEST_DID,
            'f:role': { '@id': 'f:userRole' },
          },
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
      console.log(JSON.stringify(response, null, 2));
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

      let pubkey, payload;

      if (verificationResult && verificationResult.arr) {
        payload = verificationResult.arr[1];
        pubkey = verificationResult.arr[3];
      }

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
});
