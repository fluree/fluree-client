type ContextString = string;

type ContextValue = string | Record<string, string>;

type ContextMap = {
  [key: string]: ContextValue;
};

type ContextArray = Array<ContextString | ContextMap>;

export type ContextStatement = ContextMap | ContextString | ContextArray;
