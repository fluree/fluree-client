import flureeCrypto from '@fluree/crypto';
const { createJWS } = flureeCrypto;
import { IFlureeConfig } from '../interfaces/IFlureeConfig';
import { IFlureeHistoryQuery } from '../interfaces/IFlureeHistoryQuery';
import { generateFetchParams } from '../utils/fetchOptions';
import { ApplicationError, HttpError } from './Error';
import fetch from 'cross-fetch';

/**
 * Class representing a history query instance.
 * @example
 * const client = await new FlureeClient({
 *  host: localhost,
 *  port: 8080
 * });
 *
 * const historyQuery = client
 *  .history({
 *    from: 'test/history-query',
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
      throw new ApplicationError(
        'either the history or commit-details key is required',
        'SYNTAX_ERROR',
        query,
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
  async send(): Promise<unknown> {
    const contentType = this.signedQuery
      ? 'application/jwt'
      : 'application/json';
    const [url, fetchOptions] = generateFetchParams(
      this.config,
      'history',
      contentType,
    );
    fetchOptions.body = this.signedQuery || JSON.stringify(this.query);

    return fetch(url, fetchOptions)
      .then((response: Response) => {
        if (response.status > 201) {
          throw new HttpError(
            'HTTP Error',
            response.status,
            response.statusText,
          );
        }
        return response.json();
      })
      .then((json: { error?: string; message?: string }) => {
        if (json.error) {
          throw new ApplicationError(
            json.message || 'Application Error',
            json.error,
            json,
          );
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
      throw new ApplicationError(
        'privateKey must be provided as either a function parameter or in the config',
        'PRIVATE_KEY',
        null,
      );
    }
    const signedHistoryQuery = createJWS(JSON.stringify(this.query), key);

    this.signedQuery = signedHistoryQuery;
    return this;
  }

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
