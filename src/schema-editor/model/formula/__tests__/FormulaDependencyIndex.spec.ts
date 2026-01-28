import { SchemaTree } from '../../tree/SchemaTree';
import { SchemaParser, resetIdCounter } from '../../schema/SchemaParser';
import { ParsedFormula, FormulaSerializer } from '..';
import {
  createSchema,
  numberField,
  objectField,
  formulaField,
} from '../../__tests__/test-helpers';

beforeEach(() => {
  resetIdCounter();
});

const createTreeWithFormulas = (properties: Record<string, unknown>) => {
  const schema = createSchema(properties);
  const parser = new SchemaParser();
  const root = parser.parse(schema);
  const tree = new SchemaTree(root);

  for (const { nodeId, expression } of parser.getPendingFormulas()) {
    const formula = new ParsedFormula(tree, nodeId, expression);
    tree.registerFormula(nodeId, formula);
  }

  return tree;
};

describe('FormulaDependencyIndex', () => {
  describe('registerFormula / getDependents', () => {
    it('tracks simple dependency', () => {
      const tree = createTreeWithFormulas({
        price: numberField(),
        total: formulaField('price * 2'),
      });

      const priceNode = tree
        .root()
        .properties()
        .find((c) => c.name() === 'price')!;
      const dependents = tree.getFormulaDependents(priceNode.id());

      expect(dependents).toHaveLength(1);
      expect(dependents[0].fieldName).toBe('total');
    });

    it('tracks multiple dependents', () => {
      const tree = createTreeWithFormulas({
        price: numberField(),
        doubled: formulaField('price * 2'),
        tripled: formulaField('price * 3'),
      });

      const priceNode = tree
        .root()
        .properties()
        .find((c) => c.name() === 'price')!;
      const dependents = tree.getFormulaDependents(priceNode.id());

      expect(dependents).toHaveLength(2);
      expect(
        dependents.map((d) => d.fieldName).sort((a, b) => a.localeCompare(b)),
      ).toEqual(['doubled', 'tripled']);
    });

    it('returns empty array for field with no dependents', () => {
      const tree = createTreeWithFormulas({
        price: numberField(),
        quantity: numberField(),
      });

      const priceNode = tree
        .root()
        .properties()
        .find((c) => c.name() === 'price')!;
      const dependents = tree.getFormulaDependents(priceNode.id());

      expect(dependents).toEqual([]);
    });
  });

  describe('unregisterFormula', () => {
    it('removes dependency tracking', () => {
      const tree = createTreeWithFormulas({
        price: numberField(),
        total: formulaField('price * 2'),
      });

      const priceNode = tree
        .root()
        .properties()
        .find((c) => c.name() === 'price')!;
      const totalNode = tree
        .root()
        .properties()
        .find((c) => c.name() === 'total')!;

      expect(tree.getFormulaDependents(priceNode.id())).toHaveLength(1);

      tree.unregisterFormula(totalNode.id());

      expect(tree.getFormulaDependents(priceNode.id())).toHaveLength(0);
    });
  });

  describe('hasFormulaDependents', () => {
    it('returns true when field has dependents', () => {
      const tree = createTreeWithFormulas({
        price: numberField(),
        total: formulaField('price * 2'),
      });

      const priceNode = tree
        .root()
        .properties()
        .find((c) => c.name() === 'price')!;
      expect(tree.hasFormulaDependents(priceNode.id())).toBe(true);
    });

    it('returns false when field has no dependents', () => {
      const tree = createTreeWithFormulas({
        price: numberField(),
        quantity: numberField(),
      });

      const priceNode = tree
        .root()
        .properties()
        .find((c) => c.name() === 'price')!;
      expect(tree.hasFormulaDependents(priceNode.id())).toBe(false);
    });
  });

  describe('nested structure dependents', () => {
    it('tracks dependents for nested fields', () => {
      const tree = createTreeWithFormulas({
        order: objectField({
          price: numberField(),
          total: formulaField('price * 2'),
        }),
      });

      const orderNode = tree.root().properties()[0];
      const priceNode = orderNode
        .properties()
        .find((c) => c.name() === 'price')!;

      const dependents = tree.getFormulaDependents(priceNode.id());
      expect(dependents).toHaveLength(1);
      expect(dependents[0].fieldName).toBe('total');
    });

    it('includes child dependents when checking parent', () => {
      const tree = createTreeWithFormulas({
        order: objectField({
          price: numberField(),
          total: formulaField('price * 2'),
        }),
      });

      const orderNode = tree.root().properties()[0];
      const dependents = tree.getFormulaDependents(orderNode.id());

      expect(dependents).toHaveLength(1);
      expect(dependents[0].fieldName).toBe('total');
    });
  });

  describe('getFormulaByNodeId', () => {
    it('returns formula for node with formula', () => {
      const tree = createTreeWithFormulas({
        price: numberField(),
        total: formulaField('price * 2'),
      });

      const totalNode = tree
        .root()
        .properties()
        .find((c) => c.name() === 'total')!;
      const formula = tree.getFormulaByNodeId(totalNode.id());

      expect(formula).not.toBeNull();
      if (formula) {
        const expression = new FormulaSerializer(
          tree,
          totalNode.id(),
          formula,
        ).serialize();
        expect(expression).toBe('price * 2');
      }
    });

    it('returns null for node without formula', () => {
      const tree = createTreeWithFormulas({
        price: numberField(),
      });

      const priceNode = tree.root().properties()[0];
      expect(tree.getFormulaByNodeId(priceNode.id())).toBeNull();
    });
  });

  describe('clearFormulaIndex', () => {
    it('removes all formulas', () => {
      const tree = createTreeWithFormulas({
        price: numberField(),
        total: formulaField('price * 2'),
      });

      const priceNode = tree
        .root()
        .properties()
        .find((c) => c.name() === 'price')!;
      expect(tree.getFormulaDependents(priceNode.id())).toHaveLength(1);

      tree.clearFormulaIndex();

      expect(tree.getFormulaDependents(priceNode.id())).toHaveLength(0);
    });
  });
});
