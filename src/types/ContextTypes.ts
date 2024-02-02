type ContextString = string;

export type ContextValue = string | Record<string, string>;

export type ContextMap = {
  [key: string]: ContextValue;
};

type ContextArray = Array<ContextString | ContextMap>;

export type ContextStatement = ContextMap | ContextString | ContextArray;
