import { describe, it, expect } from '@jest/globals';
import { PropertySegment, ItemsSegment } from '../PathSegment';

describe('PropertySegment', () => {
  it('is a property', () => {
    const seg = new PropertySegment('name');
    expect(seg.isProperty()).toBe(true);
  });

  it('is not items', () => {
    const seg = new PropertySegment('name');
    expect(seg.isItems()).toBe(false);
  });

  it('returns property name', () => {
    const seg = new PropertySegment('name');
    expect(seg.propertyName()).toBe('name');
  });

  it('equals another property with same name', () => {
    const a = new PropertySegment('name');
    const b = new PropertySegment('name');
    expect(a.equals(b)).toBe(true);
  });

  it('does not equal property with different name', () => {
    const a = new PropertySegment('name');
    const b = new PropertySegment('other');
    expect(a.equals(b)).toBe(false);
  });

  it('does not equal items segment', () => {
    const prop = new PropertySegment('name');
    const items = new ItemsSegment();
    expect(prop.equals(items)).toBe(false);
  });
});

describe('ItemsSegment', () => {
  it('is not a property', () => {
    const seg = new ItemsSegment();
    expect(seg.isProperty()).toBe(false);
  });

  it('is items', () => {
    const seg = new ItemsSegment();
    expect(seg.isItems()).toBe(true);
  });

  it('throws on propertyName', () => {
    const seg = new ItemsSegment();
    expect(() => seg.propertyName()).toThrow(
      'Items segment has no property name',
    );
  });

  it('equals another items segment', () => {
    const a = new ItemsSegment();
    const b = new ItemsSegment();
    expect(a.equals(b)).toBe(true);
  });

  it('does not equal property segment', () => {
    const items = new ItemsSegment();
    const prop = new PropertySegment('name');
    expect(items.equals(prop)).toBe(false);
  });
});
