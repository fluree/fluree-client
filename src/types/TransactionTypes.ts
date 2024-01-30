type InsertObject = {
  [key: string]: string | InsertStatement;
};

type InsertArray = Array<InsertObject>;

type DeleteObject = {
  [key: string]: string | DeleteStatement;
};

type DeleteArray = Array<DeleteObject>;

export type InsertStatement = InsertObject | InsertArray;

export type DeleteStatement = DeleteObject | DeleteArray;
