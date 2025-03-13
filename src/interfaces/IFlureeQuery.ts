import { SelectArray, SelectStatement } from '../types/SelectTypes';
import { WhereStatement } from '../types/WhereTypes';
import { ContextStatement } from '../types/ContextTypes';
import { ValuesStatement } from 'src/types/ValuesTypes';
import { InsertStatement } from 'src/types/TransactionTypes';

export interface SelectObject {
  [key: string]: SelectArray | SelectObject;
}

export interface QueryOpts {
  meta?: boolean;
  role?: string[] | { '@id': string }[];
  did?: string | { '@id': string };
  policyClass?: string[] | { '@id': string }[];
  policy?: InsertStatement;
}

export interface IFlureeQuery {
  select?: SelectStatement;
  selectOne?: SelectStatement;
  selectDistinct?: SelectStatement;
  where?: WhereStatement;
  from?: string | Array<string>;
  opts?: QueryOpts;
  t?: string;
  values?: ValuesStatement;
  ['@context']?: ContextStatement;
  groupBy?: string;
  orderBy?: string | Array<string>;
  having?: string | Array<string>;
  limit?: number;
  offset?: number;
}
