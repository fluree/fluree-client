import { IFlureeConfig } from '../interfaces/IFlureeConfig';
import { IFlureeTransaction } from '../interfaces/IFlureeTransaction';
import { mergeContexts } from '../utils/contextHandler';
import { generateFetchParams } from '../utils/fetchOptions';
import { createJWS } from '@fluree/crypto';
import { ApplicationError, HttpError } from './Error';

/**
 * Class representing a transaction instance.
 * @example
 * const client = await new FlureeClient({
 *  host: localhost,
 *  port: 8080,
 *  ledger: 'test/query',
 * }).connect();
 *
 * const transaction = client
 *  .transact({
 *   insert: { "@id": "freddy", "name": "Freddy" }
 *  })
 *
 * const response = await transaction.send();
 */
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
        transactionContext,
      );
    }

    if (config.signMessages) {
      this.sign();
    }
  }

  /**
   * This async method sends the transaction to the Fluree instance
   * @returns Promise<any> - The response from the transaction
   * @example
   * const response = await transaction.send();
   */
  async send(): Promise<unknown> {
    const contentType = this.signedTransaction
      ? 'application/jwt'
      : 'application/json';
    const [url, fetchOptions] = generateFetchParams(
      this.config,
      'transact',
      contentType,
    );
    fetchOptions.body =
      this.signedTransaction || JSON.stringify(this.transaction);

    try {
      const response = await fetch(url, fetchOptions);
      const json = await response.json();

      // Check for HTTP errors or application-specific errors in the JSON
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
   * Signs a transaction with the provided privateKey (or the privateKey from the config if none is provided)
   * @param privateKey - (Optional) The private key to sign the transaction with
   * @returns TransactionInstance
   * @example
   * const signedTransaction = transaction.sign(privateKey);
   *
   * // or
   *
   * const signedTransaction = transaction.sign(); // if the privateKey is provided in the config
   */
  sign(privateKey?: string): TransactionInstance {
    const key = privateKey || this.config.privateKey;
    if (!key) {
      throw new ApplicationError(
        'privateKey must be provided in either the transaction or the config',
        'NO_PRIVATE_KEY',
        null,
      );
    }
    const signedTransaction = createJWS(JSON.stringify(this.transaction), key);

    this.signedTransaction = signedTransaction;
    return this;
  }

  /**
   * Returns the signed transaction as a JWS string (if the transaction has been signed)
   * @returns string
   * @example
   * const signedTransaction = transaction.sign();
   *
   * const jwsString = transaction.getSignedTransaction();
   */
  getSignedTransaction(): string {
    return this.signedTransaction;
  }

  /**
   * Returns the fully-qualified transaction object
   * @returns IFlureeTransaction
   * @example
   * const client = await new FlureeClient({
   *  host: localhost,
   *  port: 8080,
   *  ledger: 'test/transaction',
   * }).connect();
   *
   * const transaction = client
   *  .transact({
   *   insert: { "@id": "freddy", "name": "Freddy" }
   *  })
   *
   * const transactionObject = transaction.getTransaction();
   *
   * console.log(transactionObject);
   * // {
   * //   insert: { "@id": "freddy", "name": "Freddy" }
   * //   ledger: "test/transaction"
   * // }
   */
  getTransaction(): IFlureeTransaction {
    return this.transaction;
  }
}
