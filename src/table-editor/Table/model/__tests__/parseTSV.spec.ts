import { parseTSV } from '../parseTSV.js';

describe('parseTSV', () => {
  it('parses simple single row', () => {
    expect(parseTSV('Alice\t30\ttrue')).toEqual([['Alice', '30', 'true']]);
  });

  it('parses multiple rows', () => {
    expect(parseTSV('A\t1\nB\t2\nC\t3')).toEqual([
      ['A', '1'],
      ['B', '2'],
      ['C', '3'],
    ]);
  });

  it('ignores trailing newline', () => {
    expect(parseTSV('A\t1\nB\t2\n')).toEqual([
      ['A', '1'],
      ['B', '2'],
    ]);
  });

  it('handles single cell', () => {
    expect(parseTSV('hello')).toEqual([['hello']]);
  });

  it('handles empty string', () => {
    expect(parseTSV('')).toEqual([]);
  });

  it('handles quoted field with embedded newline', () => {
    const input =
      '"Laptop4 wer we\nsdf sdf sdf sdf sd "\t991\t3\t2997\tTRUE\nMouse2\t25\t3\t75\tFALSE\nMonitor3\t450\t1\t450\tTRUE';
    expect(parseTSV(input)).toEqual([
      ['Laptop4 wer we\nsdf sdf sdf sdf sd ', '991', '3', '2997', 'TRUE'],
      ['Mouse2', '25', '3', '75', 'FALSE'],
      ['Monitor3', '450', '1', '450', 'TRUE'],
    ]);
  });

  it('handles quoted field with escaped double quotes', () => {
    const input = '"say ""hello"" world"\t123';
    expect(parseTSV(input)).toEqual([['say "hello" world', '123']]);
  });

  it('handles multiple quoted fields in one row', () => {
    const input = '"line1\nline2"\t"col2\nmore"\t plain';
    expect(parseTSV(input)).toEqual([['line1\nline2', 'col2\nmore', ' plain']]);
  });

  it('handles quoted field followed by unquoted rows', () => {
    const input = '"multi\nline"\t100\nSimple\t200';
    expect(parseTSV(input)).toEqual([
      ['multi\nline', '100'],
      ['Simple', '200'],
    ]);
  });

  it('handles Windows line endings (CRLF)', () => {
    expect(parseTSV('A\t1\r\nB\t2\r\n')).toEqual([
      ['A', '1'],
      ['B', '2'],
    ]);
  });

  it('handles quoted field with CRLF inside', () => {
    const input = '"line1\r\nline2"\t100\r\nSimple\t200';
    expect(parseTSV(input)).toEqual([
      ['line1\r\nline2', '100'],
      ['Simple', '200'],
    ]);
  });
});
