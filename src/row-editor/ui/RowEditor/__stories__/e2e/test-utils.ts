import { expect, within, userEvent, waitFor, screen } from 'storybook/test';

type Canvas = ReturnType<typeof within>;

export function getRow(canvas: Canvas, testId: string) {
  return canvas.getByTestId(testId);
}

export function getEditor(canvas: Canvas, testId: string) {
  return canvas.getByTestId(`${testId}-editor`);
}

export function findEditor(canvas: Canvas, testId: string) {
  return canvas.findByTestId(`${testId}-editor`);
}

export function getAddButton(canvas: Canvas, testId: string) {
  return canvas.getByTestId(`${testId}-add-button`);
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function editField(canvas: Canvas, testId: string, value: string) {
  const editor = await canvas.findByTestId(`${testId}-editor`);
  await userEvent.click(editor);
  await delay(10);

  // Select all existing text and delete it
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(editor);
  selection?.removeAllRanges();
  selection?.addRange(range);
  await delay(10);

  // Type new value character by character
  for (const char of value) {
    await userEvent.keyboard(char);
  }
  await delay(100);

  // Blur to commit
  editor.blur();
  await delay(100);
}

export const editStringField = editField;
export const editNumberField = editField;

export async function selectBoolean(
  canvas: Canvas,
  testId: string,
  value: boolean,
) {
  const editor = await canvas.findByTestId(`${testId}-editor`);
  await userEvent.click(editor);

  await waitFor(async () => {
    const item = screen.getByText(value.toString());
    await expect(item).toBeInTheDocument();
  });

  const item = screen.getByText(value.toString());
  await userEvent.click(item);
}

export async function expandField(canvas: Canvas, testId: string) {
  const row = await canvas.findByTestId(testId);
  await userEvent.hover(row);
  await waitFor(() => {
    const button = canvas.getByTestId(`${testId}-expand`);
    expect(button).toBeInTheDocument();
  });
  const button = canvas.getByTestId(`${testId}-expand`);
  await userEvent.click(button);
}

export async function collapseField(canvas: Canvas, testId: string) {
  const row = await canvas.findByTestId(testId);
  await userEvent.hover(row);
  await waitFor(() => {
    const button = canvas.getByTestId(`${testId}-collapse`);
    expect(button).toBeInTheDocument();
  });
  const button = canvas.getByTestId(`${testId}-collapse`);
  await userEvent.click(button);
}

export async function addArrayItem(canvas: Canvas, testId: string) {
  const button = await canvas.findByTestId(`${testId}-add-button`);
  await userEvent.click(button);
}

export async function expectFieldValue(
  canvas: Canvas,
  testId: string,
  value: string,
) {
  await waitFor(() => {
    const editor = getEditor(canvas, testId);
    expect(editor).toHaveTextContent(value);
  });
}

export async function expectRowExists(canvas: Canvas, testId: string) {
  await waitFor(() => {
    const row = getRow(canvas, testId);
    expect(row).toBeInTheDocument();
  });
}

export async function expectRowNotExists(canvas: Canvas, testId: string) {
  await waitFor(() => {
    const row = canvas.queryByTestId(testId);
    expect(row).not.toBeInTheDocument();
  });
}

export async function expectExpandButtonExists(canvas: Canvas, testId: string) {
  await waitFor(() => {
    const button = canvas.queryByTestId(`${testId}-expand`);
    expect(button).toBeInTheDocument();
  });
}

export async function expectCollapseButtonExists(
  canvas: Canvas,
  testId: string,
) {
  await waitFor(() => {
    const button = canvas.queryByTestId(`${testId}-collapse`);
    expect(button).toBeInTheDocument();
  });
}
