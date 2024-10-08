import { SelectArray, SelectStatement } from "../types/SelectTypes";
import { WhereStatement } from "../types/WhereTypes";
import { ContextStatement } from "../types/ContextTypes";

export interface SelectObject {
  [key: string]: SelectArray | SelectObject;
}

export interface QueryOpts {
  meta?: boolean;
  role?: string;
  did?: string;
}

export interface IFlureeQuery {
  select?: SelectStatement;
  selectOne?: SelectStatement;
  selectDistinct?: SelectStatement;
  where?: WhereStatement;
  from?: string | Array<string>;
  opts?: QueryOpts;
  t?: string;
  ["@context"]?: ContextStatement;
  groupBy?: string;
  orderBy?: string | Array<string>;
  having?: string | Array<string>;
  limit?: number;
  offset?: number;
}
