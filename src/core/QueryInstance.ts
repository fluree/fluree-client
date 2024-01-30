import { IFlureeConfig } from '../interfaces/IFlureeConfig';
import { IFlureeQuery } from '../interfaces/IFlureeQuery';
import { FlureeError } from './FlureeError';

export class QueryInstance {
  query;
  config;
  constructor(query: IFlureeQuery, config: IFlureeConfig) {
    this.query = query;
    this.config = config;
  }

  async send() {
    const { host, port } = this.config;
    let url = `http://${host}`;
    if (port) {
      url += `:${port}`;
    }
    url += '/fluree/query';
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
