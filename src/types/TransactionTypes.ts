type InsertObject = {
  [key: string]: string | string[] | number | number[] | boolean | boolean[] | InsertStatement;
};

export type InsertArray = Array<InsertObject>;

type DeleteObject = {
  [key: string]: string | DeleteStatement;
};

type DeleteArray = Array<DeleteObject>;

export type InsertStatement = InsertObject | InsertArray;

export type DeleteStatement = DeleteObject | DeleteArray;

export type UpsertStatement = InsertStatement;
