// Represents a typed RDF value
export type TypedValue = {
  '@type': string;
  '@value': string | number | boolean;
};

// A valid value can be:
// - A simple literal (string | number | boolean)
// - A typed value (with @type and @value)
export type Value = string | number | boolean | TypedValue;

// Case 1, 2, 3: Single variable with one or more values
export type SingleVariableValues = [varName: string, values: Value[]];

// Case 4, 5: Multiple variables with one or more value tuples
export type MultiVariableValues = [varNames: string[], valueSets: Value[][]];

// The `values` type can be either single-variable or multi-variable cases
export type ValuesStatement = SingleVariableValues | MultiVariableValues;
