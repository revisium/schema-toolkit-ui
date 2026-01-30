import { ArrayValueNode } from '../../node/ArrayValueNode';
import { NumberValueNode } from '../../node/NumberValueNode';
import { resetNodeIdCounter } from '../../node';
import type { SchemaDefinition } from '../../core';

beforeEach(() => {
  resetNodeIdCounter();
});

describe('ArrayValueNode.revert - structural changes', () => {
  const arraySchema: SchemaDefinition = {
    type: 'array',
    items: { type: 'number', default: 0 },
  };

  const createNumberNode = (name: string, value: number) => {
    return new NumberValueNode(
      undefined,
      name,
      { type: 'number', default: 0 },
      value,
    );
  };

  it('restores removed items on revert', () => {
    const item1 = createNumberNode('0', 10);
    const item2 = createNumberNode('1', 20);
    const array = new ArrayValueNode(undefined, 'arr', arraySchema, [
      item1,
      item2,
    ]);

    array.commit();
    expect(array.isDirty).toBe(false);
    expect(array.length).toBe(2);

    array.removeAt(1);
    expect(array.length).toBe(1);
    expect(array.isDirty).toBe(true);

    array.revert();

    expect(array.length).toBe(2);
    expect(array.at(0)?.getPlainValue()).toBe(10);
    expect(array.at(1)?.getPlainValue()).toBe(20);
    expect(array.isDirty).toBe(false);
  });

  it('removes added items on revert', () => {
    const item1 = createNumberNode('0', 10);
    const array = new ArrayValueNode(undefined, 'arr', arraySchema, [item1]);

    array.commit();
    expect(array.length).toBe(1);

    const item2 = createNumberNode('1', 20);
    array.push(item2);
    expect(array.length).toBe(2);
    expect(array.isDirty).toBe(true);

    array.revert();

    expect(array.length).toBe(1);
    expect(array.at(0)?.getPlainValue()).toBe(10);
    expect(array.isDirty).toBe(false);
  });

  it('restores original order on revert after move', () => {
    const item1 = createNumberNode('0', 10);
    const item2 = createNumberNode('1', 20);
    const item3 = createNumberNode('2', 30);
    const array = new ArrayValueNode(undefined, 'arr', arraySchema, [
      item1,
      item2,
      item3,
    ]);

    array.commit();

    array.move(0, 2);
    expect(array.at(0)?.getPlainValue()).toBe(20);
    expect(array.at(2)?.getPlainValue()).toBe(10);
    expect(array.isDirty).toBe(true);

    array.revert();

    expect(array.at(0)?.getPlainValue()).toBe(10);
    expect(array.at(1)?.getPlainValue()).toBe(20);
    expect(array.at(2)?.getPlainValue()).toBe(30);
    expect(array.isDirty).toBe(false);
  });

  it('reverts both structural and value changes', () => {
    const item1 = createNumberNode('0', 10);
    const item2 = createNumberNode('1', 20);
    const array = new ArrayValueNode(undefined, 'arr', arraySchema, [
      item1,
      item2,
    ]);

    array.commit();

    item1.setValue(100);
    array.removeAt(1);
    expect(array.isDirty).toBe(true);

    array.revert();

    expect(array.length).toBe(2);
    expect(array.at(0)?.getPlainValue()).toBe(10);
    expect(array.at(1)?.getPlainValue()).toBe(20);
    expect(array.isDirty).toBe(false);
  });

  it('handles revert after clear', () => {
    const item1 = createNumberNode('0', 10);
    const item2 = createNumberNode('1', 20);
    const array = new ArrayValueNode(undefined, 'arr', arraySchema, [
      item1,
      item2,
    ]);

    array.commit();
    array.clear();
    expect(array.length).toBe(0);
    expect(array.isDirty).toBe(true);

    array.revert();

    expect(array.length).toBe(2);
    expect(array.isDirty).toBe(false);
  });
});
