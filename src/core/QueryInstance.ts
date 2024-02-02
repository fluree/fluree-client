import { IFlureeConfig } from '../interfaces/IFlureeConfig';
import { IFlureeQuery } from '../interfaces/IFlureeQuery';
import { mergeContexts } from '../utils/contextHandler';
import { FlureeError } from './FlureeError';
import { createJWS } from '@fluree/crypto';

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

  async send() {
    const query = this.signedQuery || JSON.stringify(this.query);
    const { host, port } = this.config;
    let url = `http://${host}`;
    if (port) {
      url += `:${port}`;
    }
    url += '/fluree/query';

    return fetch(url, {
      method: 'POST',
      body: query,
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

  setTime(time: string): QueryInstance {
    this.query.t = time;
    return this;
  }

  getSignedQuery(): string {
    return this.signedQuery;
  }
}
