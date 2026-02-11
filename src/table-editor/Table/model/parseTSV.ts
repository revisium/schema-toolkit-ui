export function parseTSV(text: string): string[][] {
  if (text.length === 0) {
    return [];
  }

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          currentField += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        currentField += ch;
        i++;
      }
    } else {
      if (ch === '"' && currentField.length === 0) {
        inQuotes = true;
        i++;
      } else if (ch === '\t') {
        currentRow.push(currentField);
        currentField = '';
        i++;
      } else if (ch === '\n') {
        currentRow.push(currentField);
        currentField = '';
        if (currentRow.length > 0 && currentRow.some((f) => f.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        i++;
      } else if (ch === '\r' && i + 1 < text.length && text[i + 1] === '\n') {
        currentRow.push(currentField);
        currentField = '';
        if (currentRow.length > 0 && currentRow.some((f) => f.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        i += 2;
      } else {
        currentField += ch;
        i++;
      }
    }
  }

  currentRow.push(currentField);
  if (currentRow.length > 0 && currentRow.some((f) => f.length > 0)) {
    rows.push(currentRow);
  }

  return rows;
}
