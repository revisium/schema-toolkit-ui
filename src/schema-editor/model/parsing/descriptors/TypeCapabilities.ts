export interface TypeCapabilities {
  readonly hasChildren: boolean;
  readonly hasItems: boolean;
  readonly hasFormula: boolean;
  readonly isPrimitive: boolean;
  readonly isContainer: boolean;
}

export const PRIMITIVE_CAPABILITIES: TypeCapabilities = {
  hasChildren: false,
  hasItems: false,
  hasFormula: true,
  isPrimitive: true,
  isContainer: false,
};

export const OBJECT_CAPABILITIES: TypeCapabilities = {
  hasChildren: true,
  hasItems: false,
  hasFormula: false,
  isPrimitive: false,
  isContainer: true,
};

export const ARRAY_CAPABILITIES: TypeCapabilities = {
  hasChildren: false,
  hasItems: true,
  hasFormula: false,
  isPrimitive: false,
  isContainer: true,
};

export const REF_CAPABILITIES: TypeCapabilities = {
  hasChildren: false,
  hasItems: false,
  hasFormula: false,
  isPrimitive: false,
  isContainer: false,
};
