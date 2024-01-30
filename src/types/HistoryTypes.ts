export type HistoryStatement = string | Array<string>;

type LatestOrNumber = 'latest' | number;

type AtType = { at: LatestOrNumber };
type FromType = { from: LatestOrNumber };
type ToType = { to: LatestOrNumber };

type FromToType = FromType | ToType | (FromType & ToType);

export type TimeStatement = AtType | FromToType;

// export type TimeStatement = Exclude<
//   AcceptableType,
//   AtType & (FromType | ToType)
// >;
