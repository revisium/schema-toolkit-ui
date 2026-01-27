import { TypeRegistry } from '../registry/TypeRegistry';
import { refTypeDescriptor } from './RefTypeDescriptor';
import { objectTypeDescriptor } from './ObjectTypeDescriptor';
import { arrayTypeDescriptor } from './ArrayTypeDescriptor';
import { stringTypeDescriptor } from './StringTypeDescriptor';
import { numberTypeDescriptor } from './NumberTypeDescriptor';
import { booleanTypeDescriptor } from './BooleanTypeDescriptor';

export { stringTypeDescriptor } from './StringTypeDescriptor';
export { numberTypeDescriptor } from './NumberTypeDescriptor';
export { booleanTypeDescriptor } from './BooleanTypeDescriptor';
export { objectTypeDescriptor } from './ObjectTypeDescriptor';
export { arrayTypeDescriptor } from './ArrayTypeDescriptor';
export { refTypeDescriptor } from './RefTypeDescriptor';

export function createDefaultRegistry(): TypeRegistry {
  const registry = new TypeRegistry();

  registry.register(refTypeDescriptor);
  registry.register(objectTypeDescriptor);
  registry.register(arrayTypeDescriptor);
  registry.register(stringTypeDescriptor);
  registry.register(numberTypeDescriptor);
  registry.register(booleanTypeDescriptor);

  return registry;
}

export const defaultRegistry = createDefaultRegistry();
