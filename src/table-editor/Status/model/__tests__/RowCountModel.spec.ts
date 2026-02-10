import { RowCountModel } from '../RowCountModel';

describe('RowCountModel', () => {
  let model: RowCountModel;

  beforeEach(() => {
    model = new RowCountModel();
  });

  it('initial state — zero counts, "0 rows"', () => {
    expect(model.totalCount).toBe(0);
    expect(model.baseTotalCount).toBe(0);
    expect(model.isFiltering).toBe(false);
    expect(model.isRefetching).toBe(false);
    expect(model.text).toBe('0 rows');
  });

  it('"4 rows" when not filtering', () => {
    model.setTotalCount(4);
    expect(model.text).toBe('4 rows');
  });

  it('"1 of 4 rows" when isFiltering=true', () => {
    model.setBaseTotalCount(4);
    model.setTotalCount(1);
    model.setIsFiltering(true);
    expect(model.text).toBe('1 of 4 rows');
  });

  it('"4 of 4 rows" when isFiltering=true but all match', () => {
    model.setBaseTotalCount(4);
    model.setTotalCount(4);
    model.setIsFiltering(true);
    expect(model.text).toBe('4 of 4 rows');
  });

  it('"0 rows" when empty', () => {
    model.setTotalCount(0);
    expect(model.text).toBe('0 rows');
  });

  it('"0 of 4 rows" when all filtered out', () => {
    model.setBaseTotalCount(4);
    model.setTotalCount(0);
    model.setIsFiltering(true);
    expect(model.text).toBe('0 of 4 rows');
  });

  it('setTotalCount updates count', () => {
    model.setTotalCount(10);
    expect(model.totalCount).toBe(10);
  });

  it('setBaseTotalCount updates base count', () => {
    model.setBaseTotalCount(20);
    expect(model.baseTotalCount).toBe(20);
  });

  it('setIsFiltering toggles filtering state', () => {
    model.setIsFiltering(true);
    expect(model.isFiltering).toBe(true);
    model.setIsFiltering(false);
    expect(model.isFiltering).toBe(false);
  });

  it('decrementBaseTotalCount reduces base and total', () => {
    model.setBaseTotalCount(10);
    model.setTotalCount(5);
    model.decrementBaseTotalCount(2);
    expect(model.baseTotalCount).toBe(8);
    expect(model.totalCount).toBe(3);
  });

  it('decrementBaseTotalCount does not go below zero', () => {
    model.setBaseTotalCount(1);
    model.setTotalCount(1);
    model.decrementBaseTotalCount(5);
    expect(model.baseTotalCount).toBe(0);
    expect(model.totalCount).toBe(0);
  });

  it('setRefetching updates refetching state', () => {
    model.setRefetching(true);
    expect(model.isRefetching).toBe(true);
    model.setRefetching(false);
    expect(model.isRefetching).toBe(false);
  });

  it('"1 row" singular for count of 1', () => {
    model.setTotalCount(1);
    expect(model.text).toBe('1 row');
  });

  it('"1 of 1 row" singular base when filtering', () => {
    model.setBaseTotalCount(1);
    model.setTotalCount(1);
    model.setIsFiltering(true);
    expect(model.text).toBe('1 of 1 row');
  });

  it('decrementBaseTotalCount defaults to 1', () => {
    model.setBaseTotalCount(5);
    model.setTotalCount(3);
    model.decrementBaseTotalCount();
    expect(model.baseTotalCount).toBe(4);
    expect(model.totalCount).toBe(2);
  });
});
