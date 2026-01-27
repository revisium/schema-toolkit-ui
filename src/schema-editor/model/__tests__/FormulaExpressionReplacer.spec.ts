import { FormulaExpressionReplacer } from '../formula/FormulaExpressionReplacer';

describe('FormulaExpressionReplacer', () => {
  let replacer: FormulaExpressionReplacer;

  beforeEach(() => {
    replacer = new FormulaExpressionReplacer();
  });

  describe('replacePathInExpression()', () => {
    it('replaces simple identifier', () => {
      const result = replacer.replacePathInExpression(
        'price * 2',
        'price',
        'cost',
      );
      expect(result).toBe('cost * 2');
    });

    it('replaces path preserving word boundaries', () => {
      const result = replacer.replacePathInExpression(
        'priceTotal + price',
        'price',
        'cost',
      );
      expect(result).toBe('priceTotal + cost');
    });

    it('replaces nested path', () => {
      const result = replacer.replacePathInExpression(
        'order.price * 2',
        'order.price',
        'item.cost',
      );
      expect(result).toBe('item.cost * 2');
    });

    it('replaces relative path', () => {
      const result = replacer.replacePathInExpression(
        '../sibling * 2',
        '../sibling',
        '../other',
      );
      expect(result).toBe('../other * 2');
    });

    it('replaces absolute path', () => {
      const result = replacer.replacePathInExpression(
        '/root.field * 2',
        '/root.field',
        '/other.value',
      );
      expect(result).toBe('/other.value * 2');
    });

    it('replaces multiple occurrences', () => {
      const result = replacer.replacePathInExpression(
        'price + price * 2',
        'price',
        'cost',
      );
      expect(result).toBe('cost + cost * 2');
    });

    it('does not replace partial matches', () => {
      const result = replacer.replacePathInExpression(
        'myPrice + priceValue',
        'price',
        'cost',
      );
      expect(result).toBe('myPrice + priceValue');
    });

    it('handles array access paths', () => {
      const result = replacer.replacePathInExpression(
        'items[*].price + total',
        'items[*].price',
        'items[*].cost',
      );
      expect(result).toBe('items[*].cost + total');
    });
  });

  describe('replaceNameInPath()', () => {
    describe('simple paths', () => {
      it('replaces exact match', () => {
        const result = replacer.replaceNameInPath('price', 'price', 'cost');
        expect(result).toBe('cost');
      });

      it('replaces name in dotted path', () => {
        const result = replacer.replaceNameInPath(
          'order.price',
          'price',
          'cost',
        );
        expect(result).toBe('order.cost');
      });

      it('replaces first segment in dotted path', () => {
        const result = replacer.replaceNameInPath(
          'order.total',
          'order',
          'item',
        );
        expect(result).toBe('item.total');
      });

      it('replaces middle segment in dotted path', () => {
        const result = replacer.replaceNameInPath(
          'order.item.price',
          'item',
          'product',
        );
        expect(result).toBe('order.product.price');
      });

      it('does not replace partial matches', () => {
        const result = replacer.replaceNameInPath(
          'orderItem.price',
          'order',
          'item',
        );
        expect(result).toBe('orderItem.price');
      });
    });

    describe('absolute paths', () => {
      it('replaces name in absolute path', () => {
        const result = replacer.replaceNameInPath(
          '/root.price',
          'price',
          'cost',
        );
        expect(result).toBe('/root.cost');
      });

      it('replaces first segment after slash', () => {
        const result = replacer.replaceNameInPath(
          '/order.total',
          'order',
          'item',
        );
        expect(result).toBe('/item.total');
      });
    });

    describe('relative paths', () => {
      it('replaces name in relative path with ../', () => {
        const result = replacer.replaceNameInPath(
          '../sibling',
          'sibling',
          'other',
        );
        expect(result).toBe('../other');
      });

      it('replaces name in relative path with multiple ../', () => {
        const result = replacer.replaceNameInPath(
          '../../field',
          'field',
          'value',
        );
        expect(result).toBe('../../value');
      });

      it('replaces name in dotted relative path', () => {
        const result = replacer.replaceNameInPath(
          '../parent.child',
          'child',
          'value',
        );
        expect(result).toBe('../parent.value');
      });

      it('replaces name in ./ relative path', () => {
        const result = replacer.replaceNameInPath(
          './sibling',
          'sibling',
          'other',
        );
        expect(result).toBe('./other');
      });
    });
  });
});
