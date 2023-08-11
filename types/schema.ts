export interface _Schema {
  name?: string;
  rootProps: _SchemaProp[];
}

export const possibleTypes = [
  "Object",
  "String",
  "Number",
  "Date",
  "Buffer",
  "Boolean",
  "Mixed",
  "ObjectId",
  "Decimal128",
  "Map",
  "UUID",
] as const;

export type possibleTypesType = (typeof possibleTypes)[number];

export interface _SchemaProp {
  name: string;
  type: possibleTypesType;
  required: boolean;
  isArray: boolean;
  _key: string;
  children: _SchemaProp[];
}
