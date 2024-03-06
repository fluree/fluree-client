import { IFlureeConfig } from '../interfaces/IFlureeConfig';

export const generateFetchParams = (
  config: IFlureeConfig,
  endpoint: string,
  contentType: string = "application/json"
): [
  string,
  {
    method: string;
    headers: {
      'Content-Type': string;
      Authorization?: string;
    };
    body?: string;
  }
] => {
  const { host, port, isFlureeHosted, apiKey } = config;
  let url;
  if (isFlureeHosted) {
    url = `https://data.flur.ee`;
  } else {
    url = `http://${host}`;
    if (port) {
      url += `:${port}`;
    }
  }
  url += `/fluree/${endpoint}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const headers: any = {
    'Content-Type': contentType,
  };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }
  return [
    url,
    {
      method: 'POST',
      headers,
    },
  ];
};
