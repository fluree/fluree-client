import { ContextStatement } from '../types/ContextTypes';
import { DeleteStatement, InsertStatement } from '../types/TransactionTypes';
import { WhereStatement } from '../types/WhereTypes';
import { QueryOpts } from './IFlureeQuery';

export interface IFlureeTransaction {
  ['@context']?: ContextStatement;
  ledger?: string;
  insert?: InsertStatement;
  delete?: DeleteStatement;
  where?: WhereStatement;
  opts?: QueryOpts;
}

export interface IFlureeCreateTransaction {
  ['@context']?: ContextStatement;
  ledger?: string;
  insert: InsertStatement;
  opts?: QueryOpts;
}
