import { ContextStatement } from './ContextTypes';

type InsertObject = {
  [key: string]:
    | string
    | string[]
    | number
    | number[]
    | boolean
    | boolean[]
    | InsertStatement;
};

export type InsertArray = Array<InsertObject>;

export type DeleteObject = {
  [key: string]: string | DeleteStatement;
};

type DeleteArray = Array<DeleteObject>;

export type InsertStatement = InsertObject | InsertArray;

export type DeleteStatement = DeleteObject | DeleteArray;

export type ContextWithInsertObject = {
  '@context': ContextStatement;
} & InsertObject;

export type ContextWithInsertStatement = {
  '@context': ContextStatement;
  '@graph': InsertStatement;
};

// Updated UpsertStatement
export type UpsertStatement =
  | InsertStatement
  | ContextWithInsertObject
  | ContextWithInsertStatement;
