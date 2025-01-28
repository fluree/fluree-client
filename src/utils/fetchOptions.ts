import { IFlureeConfig } from '../interfaces/IFlureeConfig';

export const getFlureeBaseUrlFromConfig = (config: IFlureeConfig) => {
  const { host, port, isFlureeHosted } = config;

  let url = "";
  if (isFlureeHosted) {
    url = `https://data.flur.ee`;
  } else {
    // if protocol is not included in `config.host`, infer it from the port
    if (!host?.startsWith("http://") && !host?.startsWith("https://")) {
      const protocol = port === 443 ? "https://" : "http://";
      url = `${protocol}${host}`;
    } else {
      url = `${host}`;
    }
    if (port) {
      url += `:${port}`;
    }
  }
  return `${url}/fluree`;
}

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
  const url = getFlureeBaseUrlFromConfig(config) + `/${endpoint}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const headers: any = {
    'Content-Type': contentType,
  };
  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }
  return [
    url,
    {
      method: 'POST',
      headers,
    },
  ];
};
