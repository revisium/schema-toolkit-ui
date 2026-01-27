import { FormulaSerializer } from '../formula/FormulaSerializer';
import { ParsedFormula } from '../formula/ParsedFormula';
import { SchemaTree } from '../tree/SchemaTree';
import { NumberNode } from '../node/NumberNode';
import { BooleanNode } from '../node/BooleanNode';
import { ObjectNode } from '../node/ObjectNode';
import { ArrayNode } from '../node/ArrayNode';

describe('FormulaSerializer', () => {
  describe('toXFormula', () => {
    it('converts formula to XFormula format', () => {
      const tree = createSimpleTree();
      const formula = new ParsedFormula(tree, 'sum', 'a + b');

      const xFormula = FormulaSerializer.toXFormula(formula);

      expect(xFormula).toEqual({
        version: 1,
        expression: 'a + b',
      });
    });
  });

  describe('serialize', () => {
    describe('literals', () => {
      it('serializes number literals', () => {
        const tree = createTreeWithField('value');
        const formula = new ParsedFormula(tree, 'value', '42');

        const serializer = new FormulaSerializer(tree, 'value', formula);
        expect(serializer.serialize()).toBe('42');
      });

      it('serializes negative number literals', () => {
        const tree = createTreeWithField('value');
        const formula = new ParsedFormula(tree, 'value', '-10');

        const serializer = new FormulaSerializer(tree, 'value', formula);
        expect(serializer.serialize()).toBe('-10');
      });

      it('serializes string literals', () => {
        const tree = createTreeWithField('value');
        const formula = new ParsedFormula(tree, 'value', '"hello"');

        const serializer = new FormulaSerializer(tree, 'value', formula);
        expect(serializer.serialize()).toBe('"hello"');
      });

      it('serializes boolean true', () => {
        const tree = createTreeWithField('value');
        const formula = new ParsedFormula(tree, 'value', 'true');

        const serializer = new FormulaSerializer(tree, 'value', formula);
        expect(serializer.serialize()).toBe('true');
      });

      it('serializes boolean false', () => {
        const tree = createTreeWithField('value');
        const formula = new ParsedFormula(tree, 'value', 'false');

        const serializer = new FormulaSerializer(tree, 'value', formula);
        expect(serializer.serialize()).toBe('false');
      });

      it('serializes null', () => {
        const tree = createTreeWithField('value');
        const formula = new ParsedFormula(tree, 'value', 'null');

        const serializer = new FormulaSerializer(tree, 'value', formula);
        expect(serializer.serialize()).toBe('null');
      });
    });

    describe('binary operations', () => {
      it('serializes addition', () => {
        const tree = createSimpleTree();
        const formula = new ParsedFormula(tree, 'sum', 'a + b');

        const serializer = new FormulaSerializer(tree, 'sum', formula);
        expect(serializer.serialize()).toBe('a + b');
      });

      it('serializes subtraction', () => {
        const tree = createSimpleTree();
        const formula = new ParsedFormula(tree, 'sum', 'a - b');

        const serializer = new FormulaSerializer(tree, 'sum', formula);
        expect(serializer.serialize()).toBe('a - b');
      });

      it('serializes multiplication', () => {
        const tree = createSimpleTree();
        const formula = new ParsedFormula(tree, 'sum', 'a * b');

        const serializer = new FormulaSerializer(tree, 'sum', formula);
        expect(serializer.serialize()).toBe('a * b');
      });

      it('serializes division', () => {
        const tree = createSimpleTree();
        const formula = new ParsedFormula(tree, 'sum', 'a / b');

        const serializer = new FormulaSerializer(tree, 'sum', formula);
        expect(serializer.serialize()).toBe('a / b');
      });

      it('serializes comparison operators', () => {
        const tree = createSimpleTree();
        const formula = new ParsedFormula(tree, 'sum', 'a > b');

        const serializer = new FormulaSerializer(tree, 'sum', formula);
        expect(serializer.serialize()).toBe('a > b');
      });

      it('serializes nested binary ops with parentheses', () => {
        const tree = createSimpleTree();
        const formula = new ParsedFormula(tree, 'sum', '(a + b) * 2');

        const serializer = new FormulaSerializer(tree, 'sum', formula);
        expect(serializer.serialize()).toBe('(a + b) * 2');
      });
    });

    describe('unary operations', () => {
      it('serializes negation', () => {
        const tree = createSimpleTree();
        const formula = new ParsedFormula(tree, 'sum', '-a');

        const serializer = new FormulaSerializer(tree, 'sum', formula);
        expect(serializer.serialize()).toBe('-a');
      });

      it('serializes logical not', () => {
        const tree = createTreeWithBooleans();
        const formula = new ParsedFormula(tree, 'result', '!flag');

        const serializer = new FormulaSerializer(tree, 'result', formula);
        expect(serializer.serialize()).toBe('!flag');
      });
    });

    describe('ternary operations', () => {
      it('serializes ternary operator', () => {
        const tree = createTreeWithBooleans();
        const formula = new ParsedFormula(tree, 'result', 'flag ? 1 : 0');

        const serializer = new FormulaSerializer(tree, 'result', formula);
        expect(serializer.serialize()).toBe('flag ? 1 : 0');
      });
    });

    describe('function calls', () => {
      it('serializes function with arguments', () => {
        const tree = createSimpleTree();
        const formula = new ParsedFormula(tree, 'sum', 'MAX(a, b)');

        const serializer = new FormulaSerializer(tree, 'sum', formula);
        expect(serializer.serialize()).toBe('MAX(a, b)');
      });
    });

    describe('identifiers and paths', () => {
      it('serializes simple identifier', () => {
        const tree = createSimpleTree();
        const formula = new ParsedFormula(tree, 'sum', 'a');

        const serializer = new FormulaSerializer(tree, 'sum', formula);
        expect(serializer.serialize()).toBe('a');
      });

      it('serializes member expression', () => {
        const tree = createNestedTree();
        const formula = new ParsedFormula(tree, 'result', 'nested.value');

        const serializer = new FormulaSerializer(tree, 'result', formula);
        expect(serializer.serialize()).toBe('nested.value');
      });
    });

    describe('array access', () => {
      it('serializes wildcard expression', () => {
        const tree = createTreeWithArray();
        const formula = new ParsedFormula(tree, 'result', 'items[*]');

        const serializer = new FormulaSerializer(tree, 'result', formula);
        expect(serializer.serialize()).toBe('items[*]');
      });

      it('serializes index expression', () => {
        const tree = createTreeWithArray();
        const formula = new ParsedFormula(tree, 'result', 'items[0]');

        const serializer = new FormulaSerializer(tree, 'result', formula);
        expect(serializer.serialize()).toBe('items[0]');
      });
    });
  });
});

function createSimpleTree(): SchemaTree {
  const root = new ObjectNode('root', 'root');
  root.addChild(new NumberNode('a', 'a'));
  root.addChild(new NumberNode('b', 'b'));
  root.addChild(new NumberNode('sum', 'sum'));
  return new SchemaTree(root);
}

function createTreeWithField(name: string): SchemaTree {
  const root = new ObjectNode('root', 'root');
  root.addChild(new NumberNode(name, name));
  return new SchemaTree(root);
}

function createTreeWithBooleans(): SchemaTree {
  const root = new ObjectNode('root', 'root');
  root.addChild(new BooleanNode('flag', 'flag'));
  root.addChild(new BooleanNode('result', 'result'));
  return new SchemaTree(root);
}

function createNestedTree(): SchemaTree {
  const root = new ObjectNode('root', 'root');
  const nested = new ObjectNode('nested', 'nested');
  nested.addChild(new NumberNode('value', 'value'));
  root.addChild(nested);
  root.addChild(new NumberNode('result', 'result'));
  return new SchemaTree(root);
}

function createTreeWithArray(): SchemaTree {
  const root = new ObjectNode('root', 'root');
  const arrayNode = new ArrayNode(
    'items',
    'items',
    new NumberNode('items-item', 'items-item'),
  );
  root.addChild(arrayNode);
  root.addChild(new NumberNode('result', 'result'));
  return new SchemaTree(root);
}
