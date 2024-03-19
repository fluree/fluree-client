import { createJWS } from '@fluree/crypto';
import { IFlureeConfig } from '../interfaces/IFlureeConfig';
import { IFlureeHistoryQuery } from '../interfaces/IFlureeHistoryQuery';
import { generateFetchParams } from '../utils/fetchOptions';
import { FlureeError } from './FlureeError';

/**
 * Class representing a history query instance.
 * @example
 * const client = await new FlureeClient({
 *  host: localhost,
 *  port: 8080,
 *  ledger: 'test/history-query',
 * }).connect();
 *
 * const historyQuery = client
 *  .history({
 *    'commit-details': true,
 *    t: { at: 'latest' },
 *   })
 *
 * const response = await historyQuery.send();
 */
export class HistoryQueryInstance {
  query;
  config;
  signedQuery = '';
  constructor(query: IFlureeHistoryQuery, config: IFlureeConfig) {
    if (!query.history && !query['commit-details']) {
      throw new FlureeError(
        'either the history or commit-details key is required'
      );
    }
    this.query = query;
    this.config = config;

    if (config.signMessages) {
      this.sign();
    }
  }

  /**
   * This async method sends the history query to the Fluree instance
   * @returns Promise<any> - The response from the history query
   * @example
   * const response = await historyQuery.send();
   */
  async send() {
    const contentType = (this.signedQuery && this.config.isFlureeHosted) ? "application/jwt" : "application/json";
    const [url, fetchOptions] = generateFetchParams(this.config, 'history', contentType);
    fetchOptions.body = this.signedQuery || JSON.stringify(this.query);

    return fetch(url, fetchOptions)
      .then((response) => {
        if (response.status > 201) {
          throw new FlureeError(response.statusText);
        }
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
   * Signs the history query with the provided privateKey (or the privateKey from the config if none is provided)
   * @param privateKey - (Optional) The private key to sign the history query with
   * @returns HistoryQueryInstance
   * @example
   * const signedHistoryQuery = historyQuery.sign(privateKey);
   *
   * // or
   *
   * const signedHistoryQuery = historyQuery.sign(); // if the privateKey is provided in the config
   */
  sign(privateKey?: string): HistoryQueryInstance {
    const key = privateKey ?? this.config.privateKey;
    if (!key) {
      throw new FlureeError(
        'privateKey must be provided as either a function parameter or in the config'
      );
    }
    const signedHistoryQuery = JSON.stringify(
      createJWS(JSON.stringify(this.query), key)
    );
    this.signedQuery = signedHistoryQuery;
    return this;
  }

  // setTime(time: string): QueryInstance {
  //   this.query.t = time;
  //   return this;
  // }

  /**
   * Returns the signed history query as a JWS string (if the history query has been signed)
   * @returns string
   * @example
   * const signedHistoryQuery = historyQuery.sign();
   *
   * const jwsString = historyQuery.getSignedQuery();
   */
  getSignedQuery(): string {
    return this.signedQuery;
  }

  /**
   * Returns the fully-qualified history query object
   * @returns IFlureeHistoryQuery
   * @example
   * const client = await new FlureeClient({
   *  host: localhost,
   *  port: 8080,
   *  ledger: 'test/history-query',
   * }).connect();
   * 
   * const historyQuery = client
   *  .history({
   *    'commit-details': true,
   *    t: { at: 'latest' },
   *  })
   * const historyQueryObject = historyQuery.getQuery();
   *
   * console.log(historyQueryObject);
   * // {
   * //   'commit-details': true,
   * //   t: { at: 'latest' },
   * //   from: "test/history-query"
   * // }
   */
  getQuery(): IFlureeHistoryQuery {
    return this.query;
  }
}
