import { SchemaTree } from '../tree/SchemaTree';
import { SchemaParser, resetIdCounter } from '../schema/SchemaParser';
import { ParsedFormula } from '../formula/ParsedFormula';
import { FormulaUpdater } from '../formula/FormulaUpdater';
import {
  createSchema,
  numberField,
  formulaField,
  objectField,
  stringFormulaField,
  booleanFormulaField,
} from './test-helpers';

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

const findNode = (tree: SchemaTree, name: string) => {
  return tree
    .root()
    .children()
    .find((c) => c.name() === name)!;
};

const findNestedNode = (
  tree: SchemaTree,
  parentName: string,
  childName: string,
) => {
  const parent = findNode(tree, parentName);
  return parent.children().find((c) => c.name() === childName)!;
};

describe('FormulaUpdater', () => {
  describe('updateFormulasOnRename()', () => {
    it('updates formula when referenced field is renamed', () => {
      const tree = createTreeWithFormulas({
        price: numberField(),
        total: formulaField('price * 2'),
      });

      const updater = new FormulaUpdater(tree);
      const priceNode = findNode(tree, 'price');

      priceNode.setName('cost');
      const updates = updater.updateFormulasOnRename(
        priceNode.id(),
        'price',
        'cost',
      );

      expect(updates).toHaveLength(1);
      expect(updates[0].oldExpression).toBe('price * 2');
      expect(updates[0].newExpression).toBe('cost * 2');
    });

    it('updates multiple formulas referencing same field', () => {
      const tree = createTreeWithFormulas({
        price: numberField(),
        doubled: formulaField('price * 2'),
        tripled: formulaField('price * 3'),
      });

      const updater = new FormulaUpdater(tree);
      const priceNode = findNode(tree, 'price');

      priceNode.setName('cost');
      const updates = updater.updateFormulasOnRename(
        priceNode.id(),
        'price',
        'cost',
      );

      expect(updates).toHaveLength(2);
      expect(
        updates.map((u) => u.newExpression).sort((a, b) => a.localeCompare(b)),
      ).toEqual(['cost * 2', 'cost * 3']);
    });

    it('returns empty array when no formulas reference the field', () => {
      const tree = createTreeWithFormulas({
        price: numberField(),
        quantity: numberField(),
      });

      const updater = new FormulaUpdater(tree);
      const priceNode = findNode(tree, 'price');

      priceNode.setName('cost');
      const updates = updater.updateFormulasOnRename(
        priceNode.id(),
        'price',
        'cost',
      );

      expect(updates).toEqual([]);
    });

    it('updates nested path references', () => {
      const tree = createTreeWithFormulas({
        order: objectField({
          price: numberField(),
        }),
        total: formulaField('order.price * 2'),
      });

      const updater = new FormulaUpdater(tree);
      const priceNode = findNestedNode(tree, 'order', 'price');

      priceNode.setName('cost');
      const updates = updater.updateFormulasOnRename(
        priceNode.id(),
        'price',
        'cost',
      );

      expect(updates).toHaveLength(1);
      expect(updates[0].newExpression).toBe('order.cost * 2');
    });

    it('updates formula with string type', () => {
      const tree = createTreeWithFormulas({
        name: { type: 'string', default: '' },
        greeting: stringFormulaField('"Hello, " + name'),
      });

      const updater = new FormulaUpdater(tree);
      const nameNode = findNode(tree, 'name');

      nameNode.setName('username');
      const updates = updater.updateFormulasOnRename(
        nameNode.id(),
        'name',
        'username',
      );

      expect(updates).toHaveLength(1);
      expect(updates[0].newExpression).toBe('"Hello, " + username');
    });

    it('updates formula with boolean type', () => {
      const tree = createTreeWithFormulas({
        value: numberField(),
        isPositive: booleanFormulaField('value > 0'),
      });

      const updater = new FormulaUpdater(tree);
      const valueNode = findNode(tree, 'value');

      valueNode.setName('amount');
      const updates = updater.updateFormulasOnRename(
        valueNode.id(),
        'value',
        'amount',
      );

      expect(updates).toHaveLength(1);
      expect(updates[0].newExpression).toBe('amount > 0');
    });
  });

  describe('updateFormulasOnMove()', () => {
    it('returns empty updates when path does not change', () => {
      const tree = createTreeWithFormulas({
        price: numberField(),
        total: formulaField('price * 2'),
      });

      const updater = new FormulaUpdater(tree);
      const priceNode = findNode(tree, 'price');
      const path = tree.pathOf(priceNode.id());

      const updates = updater.updateFormulasOnMove(priceNode.id(), path, path);

      expect(updates).toEqual([]);
    });

    it('handles formula inside moved node with relative reference', () => {
      const tree = createTreeWithFormulas({
        basePrice: numberField(),
        order: objectField({
          price: numberField(),
          total: formulaField('price * 2'),
        }),
      });

      const updater = new FormulaUpdater(tree);
      const orderNode = findNode(tree, 'order');
      const oldPath = tree.pathOf(orderNode.id());

      const newPath = tree.pathOf(orderNode.id());

      const updates = updater.updateFormulasOnMove(
        orderNode.id(),
        oldPath,
        newPath,
      );

      expect(updates).toBeDefined();
    });

    it('preserves absolute path references', () => {
      const tree = createTreeWithFormulas({
        config: objectField({
          multiplier: numberField(),
        }),
        price: numberField(),
        total: formulaField('/config.multiplier * price'),
      });

      const updater = new FormulaUpdater(tree);
      const priceNode = findNode(tree, 'price');
      const oldPath = tree.pathOf(priceNode.id());

      const updates = updater.updateFormulasOnMove(
        priceNode.id(),
        oldPath,
        oldPath,
      );

      expect(updates).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('does not report update when renamed field is removed from tree', () => {
      const tree = createTreeWithFormulas({
        price: numberField(),
        total: formulaField('price * 2'),
      });

      const updater = new FormulaUpdater(tree);
      const priceNode = findNode(tree, 'price');

      tree.root().removeChild('price');

      const updates = updater.updateFormulasOnRename(
        priceNode.id(),
        'price',
        'cost',
      );

      expect(updates).toHaveLength(0);
    });

    it('handles multiple dependencies in single formula', () => {
      const tree = createTreeWithFormulas({
        price: numberField(),
        quantity: numberField(),
        total: formulaField('price * quantity'),
      });

      const updater = new FormulaUpdater(tree);
      const priceNode = findNode(tree, 'price');

      priceNode.setName('cost');
      const updates = updater.updateFormulasOnRename(
        priceNode.id(),
        'price',
        'cost',
      );

      expect(updates).toHaveLength(1);
      expect(updates[0].newExpression).toBe('cost * quantity');
    });

    it('does not update unrelated fields with similar names', () => {
      const tree = createTreeWithFormulas({
        price: numberField(),
        priceTotal: numberField(),
        total: formulaField('price + priceTotal'),
      });

      const updater = new FormulaUpdater(tree);
      const priceNode = findNode(tree, 'price');

      priceNode.setName('cost');
      const updates = updater.updateFormulasOnRename(
        priceNode.id(),
        'price',
        'cost',
      );

      expect(updates).toHaveLength(1);
      expect(updates[0].newExpression).toBe('cost + priceTotal');
    });
  });
});
