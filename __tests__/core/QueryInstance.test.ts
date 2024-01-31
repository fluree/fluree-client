import { FlureeClient } from '../../src';
import { FlureeError } from '../../src/core/FlureeError';
import { verifyJWS } from '@fluree/crypto';

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
    expect(error).toBeInstanceOf(FlureeError);
    if (error instanceof FlureeError) {
      expect(error.message).toMatch(/db\/invalid-query/);
    }
  });

  // TODO: Need to speak with Dan to understand how to test this

  it.skip('can use sign() to sign a query', async () => {
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
    const response = await client
      .query({
        selectOne: '?s',
      })
      .sign(process.env.TEST_DID)
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
});
