import { HistoryStatement, TimeStatement } from '../types/HistoryTypes';

export interface IFlureeHistoryQuery {
  from?: string | Array<string>;
  history?: HistoryStatement;
  t: TimeStatement;
  ['commit-details']?: boolean;
}
