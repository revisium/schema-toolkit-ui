import { ValidatorRegistry } from './ValidatorRegistry';
import { ValidatorResolver } from './ValidatorResolver';
import { ValidationEngine } from './ValidationEngine';
import {
  RequiredValidator,
  ForeignKeyValidator,
  MinLengthValidator,
  MaxLengthValidator,
  PatternValidator,
  EnumValidator,
  MinimumValidator,
  MaximumValidator,
} from './validators';
import { SchemaPropertyRule, SchemaTruthyRule } from './rules';

export function createDefaultValidatorRegistry(): ValidatorRegistry {
  const registry = new ValidatorRegistry();

  registry
    .register('required', () => new RequiredValidator())
    .register('foreignKey', () => new ForeignKeyValidator())
    .register('minLength', () => new MinLengthValidator())
    .register('maxLength', () => new MaxLengthValidator())
    .register('pattern', () => new PatternValidator())
    .register('enum', () => new EnumValidator())
    .register('min', () => new MinimumValidator())
    .register('max', () => new MaximumValidator());

  registry
    .addRule(new SchemaTruthyRule('required', 'required'))
    .addRule(new SchemaPropertyRule('foreignKey', 'foreignKey'))
    .addRule(new SchemaPropertyRule('minLength', 'minLength'))
    .addRule(new SchemaPropertyRule('maxLength', 'maxLength'))
    .addRule(new SchemaPropertyRule('pattern', 'pattern'))
    .addRule(new SchemaPropertyRule('enum', 'enum'))
    .addRule(new SchemaPropertyRule('min', 'minimum'))
    .addRule(new SchemaPropertyRule('max', 'maximum'));

  return registry;
}

export function createValidationEngine(
  registry?: ValidatorRegistry,
): ValidationEngine {
  const reg = registry ?? createDefaultValidatorRegistry();
  const resolver = new ValidatorResolver(reg);
  return new ValidationEngine(resolver);
}
