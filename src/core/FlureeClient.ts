import { IFlureeConfig } from '../interfaces/IFlureeConfig';
import { IFlureeHistoryQuery } from '../interfaces/IFlureeHistoryQuery';
import { IFlureeQuery } from '../interfaces/IFlureeQuery';
import {
  IFlureeCreateTransaction,
  IFlureeTransaction,
} from '../interfaces/IFlureeTransaction';
import { ContextStatement } from '../types/ContextTypes';
import { UpsertStatement } from '../types/TransactionTypes';
import {
  extractContextAndBody,
  findIdAlias,
  mergeContexts,
  resolveIdAlias,
} from '../utils/contextHandler';
import { handleDelete, handleUpsert } from '../utils/transactionUtils';
import { ApplicationError, HttpError } from './Error';
import { HistoryQueryInstance } from './HistoryQueryInstance';
import { QueryInstance } from './QueryInstance';
import { TransactionInstance } from './TransactionInstance';
import fetch from 'cross-fetch';
import flureeCrypto from '@fluree/crypto';
import { getFlureeBaseUrlFromConfig } from '../utils/fetchOptions';
const { generateKeyPair, pubKeyFromPrivate, accountIdFromPublic, createJWS } =
  flureeCrypto;

/**
 * FlureeClient is the main class for interacting with FlureeDB
 * @param config - Configuration for the FlureeClient
 * @param config.ledger - The ledger/db name on the Fluree instance
 * @param config.host - The host where your instance is running (e.g. localhost)
 * @param config.port - The port where your instance is running (e.g. 58090)
 * @param config.create - If true, the ledger will be created if it does not exist
 * @param config.privateKey - The private key to use for signing messages
 * @param config.signMessages - If true, messages will be signed by default
 * @param config.defaultContext - The default context to use for queries/txns
 * @param config.isFlureeHosted - If true, the client will use the Fluree hosted service
 * @param config.apiKey - The API key to use for the Fluree hosted service
 * @example
 * const client = new FlureeClient({
 *   isFlureeHosted: true,
 *   apiKey: process.env.FLUREE_API_KEY
 * });
 *
 * await client.query({
 *  select: { "freddy": ["*"] }
 * }).send();
 */
export class FlureeClient {
  config: IFlureeConfig;
  connected: boolean;

  constructor(config: IFlureeConfig = {}) {
    const { privateKey } = config;
    this.#checkConfig(config);
    this.config = config;
    if (privateKey) {
      this.setKey(privateKey);
    }
    this.connected = false;
  }

  #checkConfig(config: IFlureeConfig, isConnecting: boolean = false): void {
    const {
      host,
      port,
      signMessages,
      privateKey,
      isFlureeHosted,
      apiKey,
      create,
    } = config;
    if (isConnecting) {
      if (isFlureeHosted) {
        if (create) {
          throw new ApplicationError(
            'cannot create a ledger through the Fluree hosted service API',
            'CLIENT_ERROR',
            null,
          );
        }
      } else {
        if (!host) {
          throw new ApplicationError(
            'host is required on either FlureeClient or connect',
            'CLIENT_ERROR',
            null,
          );
        }
      }
    }

    if (signMessages && !privateKey) {
      throw new ApplicationError(
        'privateKey is required when signMessages is true',
        'CLIENT_ERROR',
        null,
      );
    }

    if (isFlureeHosted) {
      if (host) {
        throw new ApplicationError(
          '"host" should not be set when using the Fluree hosted service',
          'CLIENT_ERROR',
          null,
        );
      }

      if (port) {
        throw new ApplicationError(
          '"port" should not be set when using the Fluree hosted service',
          'CLIENT_ERROR',
          null,
        );
      }

      if (!apiKey && !privateKey) {
        console.warn(
          'either an "apiKey" or a "privateKey" for signing messages is required when using the Fluree hosted service',
        );
      }
    }
  }

  /**
   * Update the configuration of the FlureeClient instance. The new configuration will be merged with the existing configuration.
   * @param config - Configuration object
   * @param config.ledger - The ledger/db name on the Fluree instance
   * @param config.host - The host where your instance is running (e.g. localhost)
   * @param config.port - The port where your instance is running (e.g. 58090)
   * @param config.create - If true, the ledger will be created if it does not exist
   * @param config.privateKey - The private key to use for signing messages
   * @param config.signMessages - If true, messages will be signed by default
   * @param config.defaultContext - The default context to use for queries/txns
   * @param config.isFlureeHosted - If true, the client will use the Fluree hosted service
   * @param config.apiKey - The API key to use for the Fluree hosted service
   * @returns FlureeClient
   * @example
   * const client = new FlureeClient({
   *   isFlureeHosted: true
   * });
   *
   * const updatedClient = client.configure({
   *   apiKey: process.env.FLUREE_API_KEY,
   * });
   */
  configure(config: IFlureeConfig): FlureeClient {
    const mergedConfig = { ...this.config, ...config };
    if (config.defaultContext) {
      if (this.config.defaultContext) {
        mergedConfig.defaultContext = mergeContexts(
          this.config.defaultContext,
          config.defaultContext,
        );
      }
    }
    this.#checkConfig(mergedConfig);
    this.config = mergedConfig;
    return this;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async #testLedgers(): Promise<any> {
    const queryInstance = this.query({
      where: {
        '@id': '?s',
        '?p': '?o',
      },
      select: ['?s'],
      limit: 1,
    });
    return queryInstance.send();
  }

  /**
   * Connect to the Fluree instance. This will test the connection and create the ledger if it does not exist.
   * This is now an optional method to validate a connection with a particular ledger.
   *
   * Will throw an error if the connection fails (e.g. invalid host, ledger does not exist, etc.)
   *
   * The FlureeClient must be connected before querying or transacting.
   * @param ledgerName - The name of the ledger to connect to. If not provided, the ledger name from the configuration will be used.
   * @returns Promise<FlureeClient>
   * @example
   * const connectedClient = await new FlureeClient({
   *   isFlureeHosted: true,
   *   apiKey: process.env.FLUREE_API_KEY,
   *   ledger: 'fluree-jld/387028092978173',
   * }).connect();
   */
  async connect(ledgerName?: string): Promise<FlureeClient> {
    this.#checkConfig(this.config, true);
    this.connected = true;
    try {
      if (this.config.create) {
        await this.#createLedger(ledgerName);
      }
      if (ledgerName) {
        this.config.ledger = ledgerName;
      }
      await this.#testLedgers();
    } catch (error) {
      this.connected = false;
      throw error;
    }
    return this;
  }

  /**
   * Create a new ledger on the Fluree instance. This will throw an error if the ledger already exists.
   *
   * The returned FlureeClient will be configured to use the new ledger.
   * @param ledger - The name of the ledger to create
   * @param transaction - An optional transaction to include when creating the ledger
   * @returns Promise<FlureeClient>
   * @example
   * const client = new FlureeClient({
   *  host: 'localhost',
   *  port: 8080,
   *  ledger: 'fluree-client/client'
   * });
   *
   * const createdClient = await client.create('new-ledger', { insert: { message: 'success' } });
   * // createdClient.config.ledger === 'new-ledger'
   */
  async create(
    ledger: string,
    transaction?: IFlureeCreateTransaction,
  ): Promise<FlureeClient> {
    await this.#createLedger(ledger, transaction);
    this.configure({ ledger });
    return this;
  }

  async #createLedger(
    ledgerName?: string,
    transaction?: IFlureeCreateTransaction,
  ): Promise<void> {
    const { signMessages, privateKey } = this.config;
    const ledger = transaction?.ledger || ledgerName || this.config.ledger;
    if (!ledger) {
      throw new ApplicationError(
        'No ledger name provided. When using create() or connect(), a ledger name is required either on FlureeClient config, as a parameter, or in the transaction',
        'CLIENT_ERROR',
        null,
      );
    }
    const url = getFlureeBaseUrlFromConfig(this.config) + '/create';
    let body: IFlureeTransaction = {
      ledger,
      insert: { message: 'success' },
    };
    if (transaction) {
      body = {
        ...body,
        ...transaction,
        ledger,
      };
    }
    let headers = {
      'Content-Type': 'application/json',
    };
    let finalBody = JSON.stringify(body);
    if (signMessages && privateKey) {
      finalBody = createJWS(finalBody, privateKey);
      headers = {
        'Content-Type': 'application/jwt',
      };
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: finalBody,
        headers,
      });
      const json = await response.json();

      if (response.status > 201) {
        throw new HttpError('HTTP Error', response.status, json);
      }

      if (json.error) {
        throw new ApplicationError(
          json.message || 'Application Error',
          json.error,
          json,
        );
      }
      this.config.ledger = ledgerName || this.config.ledger;
      return json;
    } catch (error) {
      if (error instanceof HttpError) {
        console.error(`HTTP Error: ${error.status}`);
        console.error('Response Body: ', JSON.stringify(error.body, null, 2));
      } else if (error instanceof ApplicationError) {
        console.error(`Application Error: ${error.errorCode}`);
        console.error('Details: ', JSON.stringify(error.details, null, 2));
      } else {
        console.error('Unexpected error: ', error);
      }
      throw error;
    }
  }

  /**
   * Creates a new QueryInstance for querying the Fluree database. The QueryInstance can be used & re-used to build, sign, and send queries to the Fluree instance.
   * @param query {IFlureeQuery} - The query to send to the Fluree instance
   * @param fetchOptions - Optional fetch options to include in the request
   * @returns QueryInstance
   * @example
   * const client = await new FlureeClient({
   *   isFlureeHosted: true,
   *   apiKey: process.env.FLUREE_API_KEY,
   * });
   *
   * const queryInstance = client.query({
   *  from: 'fluree-jld/387028092978173',
   *  select: { "freddy": ["*"] }
   * });
   *
   * const response = await queryInstance.send();
   */
  query(query: IFlureeQuery, fetchOptions?: RequestInit): QueryInstance {
    const { from } = query;
    if (!this.config.ledger && !from) {
      throw new ApplicationError(
        'must either configure a ledger on FlureClient or provide a "from" in the query',
        'CLIENT_ERROR',
        null,
      );
    }
    if (!from) {
      query.from = this.config.ledger;
    }
    return new QueryInstance(query, this.config, fetchOptions);
  }

  /**
   * Creates a new TransactionInstance for transacting with the Fluree database. The TransactionInstance can be used & re-used to build, sign, and send transactions to the Fluree instance.
   * @param transaction {IFlureeTransaction} - The transaction to send to the Fluree instance
   * @param fetchOptions - Optional fetch options to include in the request
   * @returns TransactionInstance
   * @example
   * const client = await new FlureeClient({
   *   isFlureeHosted: true,
   *   apiKey: process.env.FLUREE_API_KEY
   * });
   *
   * const transaction = client.transact({
   *  ledger: 'fluree-jld/387028092978173',
   *  insert: { "@id": "freddy", "name": "Freddy" }
   * });
   *
   * const response = await transaction.send();
   */
  transact(
    transaction: IFlureeTransaction,
    fetchOptions?: RequestInit,
  ): TransactionInstance {
    const { ledger } = transaction;
    if (!this.config.ledger && !ledger) {
      throw new ApplicationError(
        'must either configure a ledger on FlureClient or provide a "ledger" in the transaction',
        'CLIENT_ERROR',
        null,
      );
    }
    if (!ledger) {
      transaction.ledger = this.config.ledger;
    }
    return new TransactionInstance(transaction, this.config, fetchOptions);
  }

  /**
   * Creates a new TransactionInstance for upserting with the Fluree database. The TransactionInstance can be used & re-used to build, sign, and send upsert transactions to the Fluree instance.
   *
   * Upsert is not an API endpoint in Fluree. This method helps to transform an upsert transaction into an insert/where/delete transaction.
   *
   * Upsert assumes that the facts provided in the transaction should be treated as the true & accurate state of the data after the transaction is processed.
   *
   * The UpsertStatement can either be a plan InsertStatement, a single-entity object w/ `@context`, or an object with `@context` and `@graph` (for upserting against multiple entities).
   *
   * This means that facts in your transaction should be inserted (if new) and should replace existing facts (if they exist on those subjects & properties).
   * @param transaction {UpsertStatement} - The upsert transaction to send to the Fluree instance
   * @param ledger - The ledger to use for the upsert transaction. If not provided, the ledger from the configuration will be used.
   * @param fetchOptions - Optional fetch options to include in the request
   * @returns TransactionInstance
   * @example
   * // Existing data:
   * // [
   * //   { "@id": "freddy", "name": "Freddy" },
   * //   { "@id": "alice", "name": "Alice" }
   * // ]
   *
   * await client.upsert([
   *  { "@id": "freddy", "name": "Freddy the Yeti" },
   *  { "@id": "alice", "age": 25}
   * ]).send();
   *
   * // New data state after txn:
   * // [
   * //   { "@id": "freddy", "name": "Freddy the Yeti" },
   * //   { "@id": "alice", "name": "Alice", "age": 25 }
   * // ]
   *
   * // Note that if this had been an "insert" freddy would now have two names.
   * // Note also that if this had been handled by deleting/insert, alice might have lost her name.
   */
  upsert(
    transaction: UpsertStatement,
    ledger?: string,
    fetchOptions?: RequestInit,
  ): TransactionInstance {
    if (!this.config.ledger && !ledger) {
      throw new ApplicationError(
        'must either configure a ledger on FlureClient or provide a "ledger" in the transaction',
        'CLIENT_ERROR',
        null,
      );
    }

    const { context, body } = extractContextAndBody(transaction);
    const idAlias = resolveIdAlias(context, this.config.defaultContext);
    const resultTransaction = handleUpsert(body, idAlias);

    resultTransaction.ledger = ledger || this.config.ledger;

    if (context) {
      resultTransaction['@context'] = context;
    }
    return new TransactionInstance(
      resultTransaction,
      this.config,
      fetchOptions,
    );
  }

  /**
   * Creates a new TransactionInstance for deleting subjects by @id in the Fluree database. The TransactionInstance can be used & re-used to build, sign, and send delete transactions to the Fluree instance.
   *
   * Delete is not an API endpoint in Fluree. This method helps to transform a single or list of subject identifiers (@id) into a where/delete transaction that deletes the subject and all facts about the subject.
   *
   * Delete assumes that all facts for the provided subjects should be retracted from the database.
   * @param id string | string[] - The subject identifier or identifiers to retract from the Fluree instance
   * @param ledger - The ledger to use for the delete transaction. If not provided, the ledger from the configuration will be used.
   * @param fetchOptions - Optional fetch options to include in the request
   * @returns TransactionInstance
   * @example
   * // Existing data:
   * // [
   * //   { "@id": "freddy", "name": "Freddy" },
   * //   { "@id": "alice", "name": "Alice" }
   * // ]
   *
   * await client.delete("freddy").send();
   *
   * // New data state after txn:
   * // [
   * //   { "@id": "alice", "name": "Alice", "age": 25 }
   * // ]
   */
  delete(
    id: string | string[],
    ledger?: string,
    fetchOptions?: RequestInit,
  ): TransactionInstance {
    if (!this.config.ledger && !ledger) {
      throw new ApplicationError(
        'must either configure a ledger on FlureClient or provide a "ledger" in the call to delete',
        'CLIENT_ERROR',
        null,
      );
    }
    const idAlias = findIdAlias(this.config.defaultContext || {});
    const resultTransaction = handleDelete(id, idAlias);
    resultTransaction.ledger = ledger || this.config.ledger;
    return new TransactionInstance(
      resultTransaction,
      this.config,
      fetchOptions,
    );
  }

  /**
   * Creates a new HistoryQueryInstance for querying the history of the Fluree database. The HistoryQueryInstance can be used & re-used to build, sign, and send history queries to the Fluree instance.
   * @param query {IFlureeHistoryQuery} - The history query to send to the Fluree instance
   * @param fetchOptions - Optional fetch options to include in the request
   * @returns HistoryQueryInstance
   * @example
   * const client = await new FlureeClient({
   *   isFlureeHosted: true,
   *   apiKey: process.env.FLUREE_API_KEY,
   *   ledger: 'fluree-jld/387028092978173',
   * }).connect();
   *
   * const historyQuery = client.history({
   *  'commit-details': true,
   *  t: { at: 'latest' }
   * });
   *
   * const response = await historyQuery.send();
   */
  history(
    query: IFlureeHistoryQuery,
    fetchOptions?: RequestInit,
  ): HistoryQueryInstance {
    const { from } = query;
    if (!this.config.ledger && !from) {
      throw new ApplicationError(
        'must either configure a ledger on FlureClient or provide a "from" in the history query',
        'CLIENT_ERROR',
        null,
      );
    }
    if (!from) {
      query.from = this.config.ledger;
    }
    return new HistoryQueryInstance(query, this.config, fetchOptions);
  }

  /**
   * This adds a private key to the FlureeClient instance. This key will be used to sign messages by default when using the sign() method on a query or transaction.
   *
   * The public key and DID will be derived from the private key and added to the FlureeClient instance.
   *
   * See also generateKeyPair()
   * @param privateKey - The private key to use for signing messages. The expected format is a base64 encoded string.
   * @returns FlureeClient
   * @example
   * const client = await new FlureeClient({
   *   isFlureeHosted: true,
   *   apiKey: process.env.FLUREE_API_KEY
   * });
   *
   * const privateKey = client.setKey('XXXXXXXX');
   *
   * const response = await client
   *  .query({
   *    from: 'fluree-jld/387028092978173',
   *    select: { "freddy": ["*"] }
   *   })
   *  .sign()
   *  .send();
   */
  setKey(privateKey: string): FlureeClient {
    const publicKey = pubKeyFromPrivate(privateKey);
    const accountId = accountIdFromPublic(publicKey);
    const did = `did:fluree:${accountId}`;
    this.configure({ privateKey, publicKey, did });
    return this;
  }

  /**
   * Automatically generates a new key pair and adds it to the FlureeClient instance. The public key and DID will be derived from the private key and added to the FlureeClient instance.
   * @returns FlureeClient
   * @example
   * const client = new FlureeClient({
   *   isFlureeHosted: true,
   *   apiKey: process.env.FLUREE_API_KEY
   * });
   *
   * client.generateKeyPair();
   *
   *
   * const privateKey = client.getPrivateKey();
   * const publicKey = client.getPublicKey();
   * const did = generatedClient.getDid();
   */
  generateKeyPair(): FlureeClient {
    const { private: privateKey, public: publicKey } = generateKeyPair();
    const accountId = accountIdFromPublic(publicKey);
    const did = `did:fluree:${accountId}`;
    this.configure({ privateKey, publicKey, did });
    return this;
  }

  /**
   * Returns the private key of the FlureeClient instance (if one has been set)
   *
   * Be careful with this method. It is not recommended to log or expose private keys.
   * @returns string | undefined
   * @example
   * const client = new FlureeClient({
   *   isFlureeHosted: true,
   *   apiKey: process.env.FLUREE_API_KEY,
   *   ledger: 'fluree-jld/387028092978173',
   * });
   *
   * client.generateKeyPair();
   *
   * const privateKey = client.getPrivateKey();
   */
  getPrivateKey(): string | undefined {
    return this.config.privateKey;
  }

  /**
   * Returns the public key of the FlureeClient instance (if one has been set)
   * @returns string | undefined
   * @example
   * const client = new FlureeClient({
   *   isFlureeHosted: true,
   *   apiKey: process.env.FLUREE_API_KEY,
   *   ledger: 'fluree-jld/387028092978173',
   * });
   *
   * client.generateKeyPair();
   *
   * const publicKey = client.getPublicKey();
   */
  getPublicKey(): string | undefined {
    return this.config.publicKey;
  }

  /**
   * Returns the DID of the FlureeClient instance (if one has been set)
   * @returns string | undefined
   * @example
   * const client = new FlureeClient({
   *   isFlureeHosted: true,
   *   apiKey: process.env.FLUREE_API_KEY,
   *   ledger: 'fluree-jld/387028092978173',
   * });
   *
   * client.generateKeyPair();
   *
   * const did = client.getDid();
   */
  getDid(): string | undefined {
    return this.config.did;
  }

  // TODO: Implement this
  // async insertDid(did?: string): Promise<void> {
  //   const didKey = did || this.config.did;
  //   if (!didKey) {
  //     throw new ApplicationError(
  //       'did is required; try calling generateKeyPair() or passing a did string as a parameter'
  //     );
  //   }
  //   await this.transact({
  //     insert: { '@id': didKey },
  //   }).send();
  // }

  /**
   * Sets the default context for the FlureeClient instance. This context will be used for all queries and transactions by default.
   *
   * Unlike addToContext(), which merges new context elements into any existing context for the client, this method will replace the existing default context entirely.
   * @param context - The context to set as the default for the FlureeClient instance
   * @returns FlureeClient
   * @example
   * const client = new FlureeClient({
   *   isFlureeHosted: true,
   *   apiKey: process.env.FLUREE_API_KEY,
   *  defaultContext: { "schema": "http://schema.org/" }
   * });
   *
   * client.setContext({ "ex": "http://example.org/" });
   *
   * // client.getContext() === { "ex": "http://example.org/" }
   */
  setContext(context: ContextStatement): FlureeClient {
    this.configure({ defaultContext: context });
    return this;
  }

  /**
   * Adds to the default context for the FlureeClient instance. This context will be used for all queries and transactions by default.
   *
   * If a default context already exists, the new context will be merged with the existing context.
   *
   * See also setContext()
   * @param context - The context to add to the default context for the FlureeClient instance
   * @returns FlureeClient
   * @example
   * const client = new FlureeClient({
   *   isFlureeHosted: true,
   *   apiKey: process.env.FLUREE_API_KEY,
   *   defaultContext: { "schema": "http://schema.org/" }
   * });
   *
   * client.addToContext({ "ex": "http://example.org/" });
   *
   * // client.getContext() === {
   * //  "schema": "http://schema.org/",
   * //  "ex": "http://example.org/"
   * // }
   */
  addToContext(context: ContextStatement): FlureeClient {
    if (this.config.defaultContext) {
      const newContext = mergeContexts(this.config.defaultContext, context);
      this.config.defaultContext = newContext;
    } else {
      this.config.defaultContext = context;
    }
    return this;
  }

  /**
   * Returns the default context for the FlureeClient instance (if one has been set)
   * @returns ContextStatement | undefined
   * @example
   * const client = new FlureeClient({
   *   isFlureeHosted: true,
   *   apiKey: process.env.FLUREE_API_KEY,
   *   defaultContext: { "schema": "http://schema.org/" }
   * });
   *
   * const context = client.getContext();
   *
   * // context === { "schema": "http://schema.org/" }
   */
  getContext(): ContextStatement | undefined {
    return this.config.defaultContext;
  }
}
