// Node types
export {
  NodeType,
  type NodeMetadata,
  EMPTY_METADATA,
  type SchemaNode,
  NULL_NODE,
  ObjectNode,
  ArrayNode,
  StringNode,
  type StringNodeOptions,
  type StringFormat,
  type ContentMediaType,
  NumberNode,
  type NumberNodeOptions,
  BooleanNode,
  type BooleanNodeOptions,
  RefNode,
} from './node/index';

// Path types
export {
  type Path,
  type PathSegment,
  PropertySegment,
  ItemsSegment,
  ITEMS_SEGMENT,
  EMPTY_PATH,
  PathFromSegments,
  SimplePath,
  JsonPointerPath,
} from './path/index';

// Tree types
export { type NodeTree, SchemaTree } from './tree/index';

// Factory
export {
  NodeFactory,
  type StringNodeFactoryOptions,
  type RefNodeOptions,
} from './factory/index';

// Schema conversion
export {
  type JsonSchemaType,
  type JsonObjectSchema,
  type JsonArraySchema,
  type JsonStringSchema,
  type JsonNumberSchema,
  type JsonBooleanSchema,
  type JsonRefSchema,
  type JsonSchemaPrimitives,
  type XFormula,
  SchemaParser,
  resetIdCounter,
  SchemaSerializer,
} from './schema/index';

// Formula
export {
  type Formula,
  type FormulaDependency,
  type FormulaDependent,
  FormulaDependencyIndex,
  ResolvedDependency,
  FormulaError,
  FormulaSerializer,
  ParsedFormula,
  RelativePath,
} from './formula/index';

// Diff
export {
  SchemaDiff,
  type JsonPatch,
  type RichPatch,
  type MetadataChangeType,
  type DefaultValueType,
} from './diff/index';

// Validation
export {
  isValidFieldName,
  FIELD_NAME_ERROR_MESSAGE,
  SchemaValidator,
  type ValidationError,
  type ValidationErrorType,
  FormulaValidator,
  type FormulaValidationError,
  parseDefaultValue,
  type ParsedDefaultValue,
} from './validation/index';

// UI helpers
export {
  type DataLossSeverity,
  type TransformationInfo,
  getTransformationInfoFromTypeChange,
  type DefaultValueExample,
  getDefaultValueExample,
  getDefaultValueFromSchema,
  type SchemaValidationError,
  type FormulaError as FormulaErrorInfo,
} from './ui/index';

// Engine
export {
  SchemaEngine,
  type ReplaceResult,
  type FormulaUpdateResult,
} from './engine/index';
