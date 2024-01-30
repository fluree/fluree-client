import { IFlureeConfig } from '../interfaces/IFlureeConfig';
import { IFlureeTransaction } from '../interfaces/IFlureeTransaction';

export class TransactionInstance {
  transaction;
  config;
  constructor(transaction: IFlureeTransaction, config: IFlureeConfig) {
    this.transaction = transaction;
    this.config = config;
  }

  async send(): Promise<unknown> {
    const { host, port } = this.config;
    let url = `http://${host}`;
    if (port) {
      url += `:${port}`;
    }
    url += '/fluree/transact';
    return fetch(url, {
      method: 'POST',
      body: JSON.stringify(this.transaction),
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
          throw new Error(`${json.error}: ${json.message}`);
        }
        return json;
      });
  }
}
