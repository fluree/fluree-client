import { IFlureeConfig } from '../interfaces/IFlureeConfig';
import { IFlureeHistoryQuery } from '../interfaces/IFlureeHistoryQuery';
import { FlureeError } from './FlureeError';

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
