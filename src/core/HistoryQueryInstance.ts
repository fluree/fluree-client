import { IFlureeConfig } from '../interfaces/IFlureeConfig';
import { IFlureeHistoryQuery } from '../interfaces/IFlureeHistoryQuery';
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
  constructor(query: IFlureeHistoryQuery, config: IFlureeConfig) {
    if (!query.history && !query['commit-details']) {
      throw new FlureeError(
        'either the history or commit-details key is required'
      );
    }
    this.query = query;
    this.config = config;
  }

  /**
   * This async method sends the history query to the Fluree instance
   * @returns Promise<any> - The response from the history query
   * @example
   * const response = await historyQuery.send();
   */
  async send() {
    const { host, port } = this.config;
    let url = `http://${host}`;
    if (port) {
      url += `:${port}`;
    }
    url += '/fluree/history';
    return fetch(url, {
      method: 'POST',
      body: JSON.stringify(this.query),
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
          throw new FlureeError(`${json.error}: ${json.message}`);
        }
        return json;
      });
  }
}
