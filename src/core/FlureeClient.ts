/*

I want my typescript lib to export an instance called 'flureeCLient' of a class called 'FlureeClient'. I want to be able to import it like this:

```
import { flureeClient } from 'fluree-client';
```

I expect to be able to use the instance like this:

```
const flureeInstance = flureeClient.configure({...});
```

The instance should have methods such as '.query()' and '.transact()' that return interim request objects that can be chained together like this:

```
const response = await flureeInstance.query({ ... }).sign({ ... }).time({ ... }).send();
```

Help me to begin to write the typescript files necessary to make this happen. I expect to be able to publish this library so that a user can do all of the above.

 */

import { IFlureeConfig } from '../interfaces/IFlureeConfig';
import { IFlureeHistoryQuery } from '../interfaces/IFlureeHistoryQuery';
import { IFlureeQuery } from '../interfaces/IFlureeQuery';
import { IFlureeTransaction } from '../interfaces/IFlureeTransaction';
import { FlureeError } from './FlureeError';
import { HistoryQueryInstance } from './HistoryQueryInstance';
import { QueryInstance } from './QueryInstance';
import { TransactionInstance } from './TransactionInstance';

export class FlureeClient {
  config: IFlureeConfig;
  connected: boolean;

  constructor(config: IFlureeConfig) {
    const { host, port, ledger, create } = config;
    this.#checkConfig(config);
    const defaultConfig = {
      timeout: 30000,
      host,
      port,
      ledger,
      create,
    };
    this.config = { ...defaultConfig, ...config };
    this.connected = false;
  }

  #checkConfig(config?: IFlureeConfig): void {
    const { host, ledger } = config || this.config;
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
}
