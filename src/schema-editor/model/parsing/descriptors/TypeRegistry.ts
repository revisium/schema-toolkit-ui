import type { JsonSchemaType } from '../../schema/JsonSchema';
import type { TypeDescriptor } from './TypeDescriptor';

export class TypeRegistry {
  private readonly descriptors: Map<string, TypeDescriptor> = new Map();
  private readonly parseOrder: TypeDescriptor[] = [];

  register(descriptor: TypeDescriptor): void {
    if (this.descriptors.has(descriptor.type)) {
      throw new Error(`Type "${descriptor.type}" is already registered`);
    }
    this.descriptors.set(descriptor.type, descriptor);
    this.parseOrder.push(descriptor);
  }

  getDescriptor(type: string): TypeDescriptor | undefined {
    return this.descriptors.get(type);
  }

  findDescriptorForSchema(schema: JsonSchemaType): TypeDescriptor | undefined {
    for (const descriptor of this.parseOrder) {
      if (descriptor.canParse(schema)) {
        return descriptor;
      }
    }
    return undefined;
  }

  getAllDescriptors(): readonly TypeDescriptor[] {
    return this.parseOrder;
  }

  getTypes(): readonly string[] {
    return Array.from(this.descriptors.keys());
  }
}
