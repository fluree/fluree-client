import { IFlureeConfig } from '../interfaces/IFlureeConfig';
import { IFlureeHistoryQuery } from '../interfaces/IFlureeHistoryQuery';
import { IFlureeQuery } from '../interfaces/IFlureeQuery';
import { IFlureeTransaction } from '../interfaces/IFlureeTransaction';
import { FlureeError } from './FlureeError';
import { HistoryQueryInstance } from './HistoryQueryInstance';
import { QueryInstance } from './QueryInstance';
import { TransactionInstance } from './TransactionInstance';
import {
  generateKeyPair,
  pubKeyFromPrivate,
  accountIdFromPublic,
} from '@fluree/crypto';

/**
 * FlureeClient is the main class for interacting with FlureeDB
 * @example
 * const client = new FlureeClient({
 *   host: 'localhost',
 *   port: 8080,
 *   ledger: 'fluree-client/client',
 * }).connect();
 *
 * await client.query({ select: { "freddy": ["*"]} }).send();
 */
export class FlureeClient {
  config: IFlureeConfig;
  connected: boolean;

  constructor(config: IFlureeConfig) {
    this.#checkConfig(config);
    const { privateKey } = config;
    this.config = config;
    if (privateKey) {
      this.setKey(privateKey);
    }
    this.connected = false;
  }

  #checkConfig(config?: IFlureeConfig): void {
    const { host, ledger, signMessages, privateKey } = config || this.config;
    if (!host) {
      throw new FlureeError(
        'host is required on either FlureeClient or connect'
      );
    }
    if (!ledger) {
      throw new FlureeError(
        'ledger is required on either FlureeClient or connect'
      );
    }
    if (signMessages && !privateKey) {
      throw new FlureeError('privateKey is required when signMessages is true');
    }
  }

  configure(config: IFlureeConfig): FlureeClient {
    const mergedConfig = { ...this.config, ...config };
    this.config = mergedConfig;
    this.#checkConfig();
    return this;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async #testLedgers(): Promise<any> {
    return this.query({
      where: {
        '@id': '?s',
      },
      selectOne: ['?s'],
    }).send();
  }

  async connect(): Promise<FlureeClient> {
    this.connected = true;
    try {
      if (this.config.create) {
        await this.createLedger();
      }
      await this.#testLedgers();
    } catch (error) {
      this.connected = false;
      throw error;
    }
    return this;
  }

  async create(ledger: string): Promise<FlureeClient> {
    await this.createLedger(ledger);
    console.log(
      `Created ledger ${ledger}. Switching ledger from ${this.config.ledger} to ${ledger}.`
    );
    this.configure({ ledger });
    return this;
  }

  async createLedger(ledgerName?: string): Promise<void> {
    const { host, port } = this.config;
    let url = `http://${host}`;
    if (port) {
      url += `:${port}`;
    }
    url += '/fluree/create';
    return fetch(url, {
      method: 'POST',
      body: JSON.stringify({
        ledger: ledgerName || this.config.ledger,
        insert: { message: 'success' },
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => {
        return response.json();
      })
      .then((json) => {
        if (json.error) {
          throw new FlureeError(`${json.error}: ${json.message}`);
        }
        return json;
      });
  }

  query(query: IFlureeQuery): QueryInstance {
    if (!this.connected) {
      throw new FlureeError(
        'You must connect before querying. Try using .connect().query() instead'
      );
    }
    if (!query.from) {
      query.from = this.config.ledger;
    }
    return new QueryInstance(query, this.config);
  }

  transact(transaction: IFlureeTransaction): TransactionInstance {
    if (!this.connected) {
      throw new FlureeError(
        'You must connect before transacting. Try using .connect().transact() instead'
      );
    }
    if (!transaction.ledger) {
      transaction.ledger = this.config.ledger;
    }
    return new TransactionInstance(transaction, this.config);
  }

  history(query: IFlureeHistoryQuery): HistoryQueryInstance {
    if (!this.connected) {
      throw new FlureeError(
        'You must connect before querying history. Try using .connect().history() instead'
      );
    }
    if (!query.from) {
      query.from = this.config.ledger;
    }
    return new HistoryQueryInstance(query, this.config);
  }

  setKey(privateKey: string): FlureeClient {
    const publicKey = pubKeyFromPrivate(privateKey);
    const accountId = accountIdFromPublic(publicKey);
    const did = `did:fluree:${accountId}`;
    this.configure({ privateKey, publicKey, did });
    return this;
  }

  generateKeyPair(): FlureeClient {
    const { private: privateKey, public: publicKey } = generateKeyPair();
    const accountId = accountIdFromPublic(publicKey);
    const did = `did:fluree:${accountId}`;
    this.configure({ privateKey, publicKey, did });
    return this;
  }

  getPublicKey(): string | undefined {
    return this.config.publicKey;
  }
}
