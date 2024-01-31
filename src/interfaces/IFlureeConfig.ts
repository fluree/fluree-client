export interface IFlureeConfig {
  ledger?: string;
  host?: string;
  port?: number;
  timeout?: number;
  create?: boolean;
  privateKey?: string;
  publicKey?: string;
  did?: string;
  signMessages?: boolean;
}
