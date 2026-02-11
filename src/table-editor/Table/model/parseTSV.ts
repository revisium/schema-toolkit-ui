function hasNonEmptyField(row: string[]): boolean {
  return row.some((f) => f.length > 0);
}

interface ParserState {
  rows: string[][];
  currentRow: string[];
  currentField: string;
  inQuotes: boolean;
  i: number;
}

function processQuotedChar(state: ParserState, text: string): void {
  const ch = text[state.i];
  if (ch === '"' && state.i + 1 < text.length && text[state.i + 1] === '"') {
    state.currentField += '"';
    state.i += 2;
  } else if (ch === '"') {
    state.inQuotes = false;
    state.i++;
  } else {
    state.currentField += ch;
    state.i++;
  }
}

function finishRow(state: ParserState): void {
  state.currentRow.push(state.currentField);
  state.currentField = '';
  if (hasNonEmptyField(state.currentRow)) {
    state.rows.push(state.currentRow);
  }
  state.currentRow = [];
}

function processUnquotedChar(state: ParserState, text: string): void {
  const ch = text[state.i];
  if (ch === '"' && state.currentField.length === 0) {
    state.inQuotes = true;
    state.i++;
  } else if (ch === '\t') {
    state.currentRow.push(state.currentField);
    state.currentField = '';
    state.i++;
  } else if (ch === '\n') {
    finishRow(state);
    state.i++;
  } else if (
    ch === '\r' &&
    state.i + 1 < text.length &&
    text[state.i + 1] === '\n'
  ) {
    finishRow(state);
    state.i += 2;
  } else {
    state.currentField += ch;
    state.i++;
  }
}

export function parseTSV(text: string): string[][] {
  if (text.length === 0) {
    return [];
  }

  const state: ParserState = {
    rows: [],
    currentRow: [],
    currentField: '',
    inQuotes: false,
    i: 0,
  };

  while (state.i < text.length) {
    if (state.inQuotes) {
      processQuotedChar(state, text);
    } else {
      processUnquotedChar(state, text);
    }
  }

  state.currentRow.push(state.currentField);
  if (hasNonEmptyField(state.currentRow)) {
    state.rows.push(state.currentRow);
  }

  return state.rows;
}
