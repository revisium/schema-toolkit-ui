export { TypeRegistry } from './TypeRegistry';
export type {
  TypeDescriptor,
  ParseContext,
  SerializeContext,
} from './TypeDescriptor';
export type { TypeCapabilities } from './TypeCapabilities';
export {
  PRIMITIVE_CAPABILITIES,
  OBJECT_CAPABILITIES,
  ARRAY_CAPABILITIES,
  REF_CAPABILITIES,
} from './TypeCapabilities';

export { stringDescriptor } from './StringDescriptor';
export { numberDescriptor } from './NumberDescriptor';
export { booleanDescriptor } from './BooleanDescriptor';
export { objectDescriptor } from './ObjectDescriptor';
export { arrayDescriptor } from './ArrayDescriptor';
export { refDescriptor } from './RefDescriptor';

import { TypeRegistry } from './TypeRegistry';
import { refDescriptor } from './RefDescriptor';
import { objectDescriptor } from './ObjectDescriptor';
import { arrayDescriptor } from './ArrayDescriptor';
import { stringDescriptor } from './StringDescriptor';
import { numberDescriptor } from './NumberDescriptor';
import { booleanDescriptor } from './BooleanDescriptor';

export function createDefaultRegistry(): TypeRegistry {
  const registry = new TypeRegistry();

  registry.register(refDescriptor);
  registry.register(objectDescriptor);
  registry.register(arrayDescriptor);
  registry.register(stringDescriptor);
  registry.register(numberDescriptor);
  registry.register(booleanDescriptor);

  return registry;
}

export const defaultRegistry = createDefaultRegistry();
