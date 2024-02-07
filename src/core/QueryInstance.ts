import { IFlureeConfig } from '../interfaces/IFlureeConfig';
import { IFlureeQuery } from '../interfaces/IFlureeQuery';
import { mergeContexts } from '../utils/contextHandler';
import { generateFetchParams } from '../utils/fetchOptions';
import { FlureeError } from './FlureeError';
import { createJWS } from '@fluree/crypto';

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
    const query = this.signedQuery || JSON.stringify(this.query);
    const [url, fetchOptions] = generateFetchParams(this.config, 'query');
    fetchOptions.body = query;

    return fetch(url, fetchOptions)
      .then((response) => {
        // if (response.status > 201) {
        //   throw new Error(response.statusText);
        // }
        return response.json();
      })
      .then((json) => {
        if (json.error) {
          throw new FlureeError(`${json.error}: ${json.message}`);
        }
        return json;
      });
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
      throw new FlureeError(
        'privateKey must be provided in either the query or the config'
      );
    }
    const signedQuery = JSON.stringify(
      createJWS(JSON.stringify(this.query), key)
    );
    this.signedQuery = signedQuery;
    return this;
  }

  // setTime(time: string): QueryInstance {
  //   this.query.t = time;
  //   return this;
  // }

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
