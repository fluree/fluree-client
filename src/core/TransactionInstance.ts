import { IFlureeConfig } from '../interfaces/IFlureeConfig';
import { IFlureeTransaction } from '../interfaces/IFlureeTransaction';
import { mergeContexts } from '../utils/contextHandler';
import { FlureeError } from './FlureeError';
import { createJWS } from '@fluree/crypto';

export class TransactionInstance {
  transaction;
  config;
  signedTransaction = '';
  constructor(transaction: IFlureeTransaction, config: IFlureeConfig) {
    this.transaction = transaction;
    this.config = config;

    if (this.config.defaultContext || this.transaction['@context']) {
      const defaultContext = this.config.defaultContext || {};
      const transactionContext = this.transaction['@context'] || {};
      this.transaction['@context'] = mergeContexts(
        defaultContext,
        transactionContext
      );
    }

    if (config.signMessages) {
      this.sign();
    }
  }

  async send(): Promise<unknown> {
    const transaction =
      this.signedTransaction || JSON.stringify(this.transaction);
    const { host, port } = this.config;

    let url = `http://${host}`;
    if (port) {
      url += `:${port}`;
    }
    url += '/fluree/transact';
    return fetch(url, {
      method: 'POST',
      body: transaction,
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => {
        // if (response.status > 201) {
        //   throw new Error(response.statusText);
        // }
        return response.json();
      })
      .then((json) => {
        if (json.error) {
          throw new Error(`${json.error}: ${json.message}`);
        }
        return json;
      });
  }

  sign(privateKey?: string): TransactionInstance {
    const key = privateKey || this.config.privateKey;
    if (!key) {
      throw new FlureeError(
        'privateKey must be provided in either the query or the config'
      );
    }
    const signedTransaction = JSON.stringify(
      createJWS(JSON.stringify(this.transaction), key)
    );
    this.signedTransaction = signedTransaction;
    return this;
  }

  getSignedTransaction(): string {
    return this.signedTransaction;
  }

  getTransaction(): IFlureeTransaction {
    return this.transaction;
  }
}
