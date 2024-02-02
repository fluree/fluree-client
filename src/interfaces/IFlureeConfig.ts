import { ContextStatement } from '../types/ContextTypes';

/**
 * Configuration for the FlureeClient
 * @param ledger - The ledger/db name on the Fluree instance
 * @param host - The host where your instance is running
 * @param port - The port where your instance is running
 * @param create - If true, the ledger will be created if it does not exist
 * @param privateKey - The private key to use for signing messages
 * @param publicKey - The public key to use for verifying signatures
 * @param did - The DID to use for signing messages
 * @param signMessages - If true, messages will be signed by default
 * @param defaultContext - The default context to use for queries
 */
export interface IFlureeConfig {
  ledger?: string;
  host?: string;
  port?: number;
  create?: boolean;
  privateKey?: string;
  publicKey?: string;
  did?: string;
  signMessages?: boolean;
  defaultContext?: ContextStatement;
}
