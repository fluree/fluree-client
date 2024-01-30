type WhereString = string;

export type WhereArray = Array<WhereCondition>;

export type WhereObject = {
  [key: string]: WhereString | WhereObject;
};

export type WhereOperation = Array<WhereString | WhereStatement>;

export type WhereCondition = WhereObject | WhereOperation;

export type WhereStatement = WhereCondition | WhereArray;
