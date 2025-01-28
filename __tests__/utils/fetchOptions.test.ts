import { IFlureeConfig } from "src/interfaces/IFlureeConfig";
import { getFlureeBaseUrlFromConfig } from "../../src/utils/fetchOptions";

describe('getFlureeBaseUrlFromConfig', () => {
  it('can be backwards compatible', () => {
    const originalConfig: IFlureeConfig = {
      host: "localhost",
      port: 8090,
      ledger: "test/ledger"
    };
    const result = getFlureeBaseUrlFromConfig(originalConfig);
    expect(result).toEqual("http://localhost:8090/fluree");
  });

  it('can support protocol in host string', () => {
    const originalConfig: IFlureeConfig = {
      host: "https://localhost",
      port: 8090,
      ledger: "test/ledger"
    };
    const result = getFlureeBaseUrlFromConfig(originalConfig);
    expect(result).toEqual("https://localhost:8090/fluree");
  });

  it('can infer https from port', () => {
    const originalConfig: IFlureeConfig = {
      host: "localhost",
      port: 443,
      ledger: "test/ledger"
    };
    const result = getFlureeBaseUrlFromConfig(originalConfig);
    expect(result).toEqual("https://localhost:443/fluree");
  });

});
