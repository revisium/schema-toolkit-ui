import { jest } from '@jest/globals';
import { SearchModel } from '../SearchModel';

describe('SearchModel', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('initial query is empty', () => {
    const model = new SearchModel(jest.fn());
    expect(model.query).toBe('');
    expect(model.debouncedQuery).toBe('');
  });

  it('setQuery updates query immediately', () => {
    const model = new SearchModel(jest.fn());
    model.setQuery('hello');
    expect(model.query).toBe('hello');
    expect(model.debouncedQuery).toBe('');
  });

  it('debouncedQuery updates after delay', () => {
    const model = new SearchModel(jest.fn(), 300);
    model.setQuery('hello');
    jest.advanceTimersByTime(300);
    expect(model.debouncedQuery).toBe('hello');
  });

  it('clear resets both query and debouncedQuery', () => {
    const model = new SearchModel(jest.fn(), 300);
    model.setQuery('hello');
    jest.advanceTimersByTime(300);
    model.clear();
    expect(model.query).toBe('');
    expect(model.debouncedQuery).toBe('');
  });

  it('hasActiveSearch reflects debouncedQuery', () => {
    const model = new SearchModel(jest.fn(), 300);
    expect(model.hasActiveSearch).toBe(false);
    model.setQuery('hello');
    expect(model.hasActiveSearch).toBe(false);
    jest.advanceTimersByTime(300);
    expect(model.hasActiveSearch).toBe(true);
  });

  it('onSearch called with debounced value', () => {
    const onSearch = jest.fn();
    const model = new SearchModel(onSearch, 300);
    model.setQuery('hello');
    expect(onSearch).not.toHaveBeenCalled();
    jest.advanceTimersByTime(300);
    expect(onSearch).toHaveBeenCalledWith('hello');
  });

  it('rapid typing debounces to last value', () => {
    const onSearch = jest.fn();
    const model = new SearchModel(onSearch, 300);
    model.setQuery('h');
    model.setQuery('he');
    model.setQuery('hel');
    model.setQuery('hello');
    jest.advanceTimersByTime(300);
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith('hello');
    expect(model.debouncedQuery).toBe('hello');
  });

  it('dispose cancels pending debounce', () => {
    const onSearch = jest.fn();
    const model = new SearchModel(onSearch, 300);
    model.setQuery('hello');
    model.dispose();
    jest.advanceTimersByTime(300);
    expect(onSearch).not.toHaveBeenCalled();
    expect(model.debouncedQuery).toBe('');
  });
});
