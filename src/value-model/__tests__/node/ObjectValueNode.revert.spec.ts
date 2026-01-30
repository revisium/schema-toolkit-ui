import { ObjectValueNode } from '../../node/ObjectValueNode';
import { StringValueNode } from '../../node/StringValueNode';
import { resetNodeIdCounter } from '../../node';
import type { SchemaDefinition } from '../../core';

beforeEach(() => {
  resetNodeIdCounter();
});

describe('ObjectValueNode.revert - structural changes', () => {
  const objectSchema: SchemaDefinition = {
    type: 'object',
    properties: {
      name: { type: 'string', default: '' },
      age: { type: 'string', default: '' },
    },
  };

  const createStringNode = (name: string, value: string) => {
    return new StringValueNode(
      undefined,
      name,
      { type: 'string', default: '' },
      value,
    );
  };

  it('restores removed children on revert', () => {
    const child1 = createStringNode('name', 'John');
    const child2 = createStringNode('age', '30');
    const obj = new ObjectValueNode(undefined, 'root', objectSchema, [
      child1,
      child2,
    ]);

    obj.commit();
    expect(obj.isDirty).toBe(false);
    expect(obj.children.length).toBe(2);

    obj.removeChild('age');
    expect(obj.children.length).toBe(1);
    expect(obj.isDirty).toBe(true);

    obj.revert();

    expect(obj.children.length).toBe(2);
    expect(obj.child('name')?.getPlainValue()).toBe('John');
    expect(obj.child('age')?.getPlainValue()).toBe('30');
    expect(obj.isDirty).toBe(false);
  });

  it('removes added children on revert', () => {
    const child1 = createStringNode('name', 'John');
    const obj = new ObjectValueNode(undefined, 'root', objectSchema, [child1]);

    obj.commit();
    expect(obj.children.length).toBe(1);

    const child2 = createStringNode('age', '30');
    obj.addChild(child2);
    expect(obj.children.length).toBe(2);
    expect(obj.isDirty).toBe(true);

    obj.revert();

    expect(obj.children.length).toBe(1);
    expect(obj.child('name')?.getPlainValue()).toBe('John');
    expect(obj.hasChild('age')).toBe(false);
    expect(obj.isDirty).toBe(false);
  });

  it('reverts both structural and value changes', () => {
    const child1 = createStringNode('name', 'John');
    const child2 = createStringNode('age', '30');
    const obj = new ObjectValueNode(undefined, 'root', objectSchema, [
      child1,
      child2,
    ]);

    obj.commit();

    child1.setValue('Jane');
    obj.removeChild('age');
    expect(obj.isDirty).toBe(true);

    obj.revert();

    expect(obj.children.length).toBe(2);
    expect(obj.child('name')?.getPlainValue()).toBe('John');
    expect(obj.child('age')?.getPlainValue()).toBe('30');
    expect(obj.isDirty).toBe(false);
  });

  it('handles revert after adding and removing same key', () => {
    const child1 = createStringNode('name', 'John');
    const obj = new ObjectValueNode(undefined, 'root', objectSchema, [child1]);

    obj.commit();

    obj.removeChild('name');
    const newChild = createStringNode('name', 'Jane');
    obj.addChild(newChild);
    expect(obj.child('name')?.getPlainValue()).toBe('Jane');

    obj.revert();

    expect(obj.child('name')?.getPlainValue()).toBe('John');
    expect(obj.isDirty).toBe(false);
  });
});
