// Represents a typed RDF value
type TypedValue = { '@type': string; '@value': string | number | boolean };

// A valid value can be:
// - A simple literal (string | number | boolean)
// - A typed value (with @type and @value)
type Value = string | number | boolean | TypedValue;

// Case 1, 2, 3: Single variable with one or more values
type SingleVariableValues = [varName: string, values: Value[]];

// Case 4, 5: Multiple variables with one or more value tuples
type MultiVariableValues = [varNames: string[], valueSets: Value[][]];

// The `values` type can be either single-variable or multi-variable cases
export type ValuesStatement = SingleVariableValues | MultiVariableValues;
