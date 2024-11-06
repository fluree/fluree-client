import { IFlureeConfig } from '../interfaces/IFlureeConfig';
import { IFlureeQuery } from '../interfaces/IFlureeQuery';
import { mergeContexts } from '../utils/contextHandler';
import { generateFetchParams } from '../utils/fetchOptions';
import flureeCrypto from '@fluree/crypto';
const { createJWS } = flureeCrypto;
import { ApplicationError, HttpError } from './Error';
import fetch from 'cross-fetch';

/**
 * Class representing a query instance.
 * @example
 * const client = await new FlureeClient({
 *  host: localhost,
 *  port: 8080,
 *  ledger: 'test/query',
 * }).connect();
 *
 * const query = client
 *  .query({
 *   select: { "freddy": ["*"] }
 *  })
 *
 * const response = await query.send();
 */
export class QueryInstance {
  query;
  config;
  signedQuery = '';
  constructor(query: IFlureeQuery, config: IFlureeConfig) {
    this.query = query;
    this.config = config;

    if (this.config.defaultContext || this.query['@context']) {
      const defaultContext = this.config.defaultContext || {};
      const queryContext = this.query['@context'] || {};
      this.query['@context'] = mergeContexts(defaultContext, queryContext);
    }

    if (config.signMessages) {
      this.sign();
    }
  }

  /**
   * This async method sends the query to the Fluree instance
   * @returns Promise<any> - The response from the query
   * @example
   * const response = await query.send();
   */
  async send() {
    const contentType = this.signedQuery
      ? 'application/jwt'
      : 'application/json';
    const [url, fetchOptions] = generateFetchParams(
      this.config,
      'query',
      contentType,
    );
    fetchOptions.body = this.signedQuery || JSON.stringify(this.query);

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
   * Signs a query with the provided privateKey (or the privateKey from the config if none is provided)
   * @param privateKey - (Optional) The private key to sign the query with
   * @returns QueryInstance
   * @example
   * const signedQuery = query.sign(privateKey);
   *
   * // or
   *
   * const signedQuery = query.sign(); // if the privateKey is provided in the config
   */
  sign(privateKey?: string): QueryInstance {
    const key = privateKey || this.config.privateKey;
    if (!key) {
      throw new ApplicationError(
        'privateKey must be provided in either the query or the config',
        'NO_PRIVATE_KEY',
        null,
      );
    }
    const signedQuery = createJWS(JSON.stringify(this.query), key);

    this.signedQuery = signedQuery;
    return this;
  }

  /**
   * Returns the signed query as a JWS string (if the query has been signed)
   * @returns string
   * @example
   * const signedQuery = query.sign();
   *
   * const jwsString = query.getSignedQuery();
   */
  getSignedQuery(): string {
    return this.signedQuery;
  }

  /**
   * Returns the fully-qualified query object
   * @returns IFlureeQuery
   * @example
   * const client = await new FlureeClient({
   *  host: localhost,
   *  port: 8080,
   *  ledger: 'test/query',
   * }).connect();
   *
   * const query = client
   *  .query({
   *   select: { "freddy": ["*"] }
   *  })
   *
   * const queryObject = query.getQuery();
   *
   * console.log(queryObject);
   * // {
   * //   select: { "freddy": ["*"] }
   * //   from: "test/query"
   * // }
   */
  getQuery(): IFlureeQuery {
    return this.query;
  }
}
