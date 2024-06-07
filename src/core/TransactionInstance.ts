import { IFlureeConfig } from '../interfaces/IFlureeConfig';
import { IFlureeTransaction } from '../interfaces/IFlureeTransaction';
import { mergeContexts } from '../utils/contextHandler';
import { generateFetchParams } from '../utils/fetchOptions';
import { FlureeError } from './FlureeError';
import { createJWS } from '@fluree/crypto';

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
        transactionContext
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
    const contentType =
      this.signedTransaction && this.config.isFlureeHosted
        ? 'application/jwt'
        : 'application/json';
    const [url, fetchOptions] = generateFetchParams(
      this.config,
      'transact',
      contentType
    );
    fetchOptions.body =
      this.signedTransaction || JSON.stringify(this.transaction);

    try {
      const response = await fetch(url, fetchOptions);
      const json = await response.json();

      // Check for HTTP errors or application-specific errors in the JSON
      if (response.status > 201 || json.error) {
        console.log(JSON.stringify(json, null, 2));
        throw new FlureeError(
          `Send Transaction Error: ${
            json.error ? json.error.message : response.statusText
          }`,
          response.status,
          response.statusText,
          json.error
        );
      }

      return json;
    } catch (error) {
      if (error instanceof FlureeError) {
        throw error; // Rethrow if it's already a FlureeError
      }
      // Wrap unknown errors in FlureeError
      throw new FlureeError(
        'Unexpected error sending transaction',
        0,
        '',
        error
      );
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
