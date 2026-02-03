import { screen, userEvent, waitFor, expect, within } from 'storybook/test';

type Canvas = ReturnType<typeof within>;

// ============ FIELD OPERATIONS ============

export const addField = async (
  canvas: Canvas,
  parentTestId: string,
  fieldName: string,
) => {
  const addButton = await canvas.findByTestId(
    `${parentTestId}-create-field-button`,
  );
  await userEvent.click(addButton);

  // Find the newest field (last child)
  await waitFor(async () => {
    const fields = canvas.queryAllByTestId(
      new RegExp(`^${parentTestId}-\\d+$`),
    );
    const lastField = fields[fields.length - 1];
    await expect(lastField).toBeInTheDocument();
  });

  const fields = canvas.queryAllByTestId(new RegExp(`^${parentTestId}-\\d+$`));
  const newField = fields[fields.length - 1];
  if (!newField) throw new Error('New field not found');

  await userEvent.type(newField, fieldName);
  return newField.getAttribute('data-testid')!;
};

export const renameField = async (
  canvas: Canvas,
  fieldTestId: string,
  newName: string,
) => {
  const field = canvas.getByTestId(fieldTestId);
  await userEvent.clear(field);
  await userEvent.type(field, newName);
};

export const deleteField = async (canvas: Canvas, fieldTestId: string) => {
  const deleteButton = await canvas.findByTestId(
    `${fieldTestId}-delete-button`,
  );
  await userEvent.click(deleteButton);
};

// ============ TYPE OPERATIONS ============

export type SchemaType =
  | 'String'
  | 'Number'
  | 'Boolean'
  | 'Object'
  | 'Array'
  | 'ForeignKeyString';

export const changeType = async (
  canvas: Canvas,
  fieldTestId: string,
  newType: SchemaType,
) => {
  const typeButton = await canvas.findByTestId(
    `${fieldTestId}-select-type-button`,
  );
  await userEvent.click(typeButton);

  await waitFor(async () => {
    const typeOption = screen.getByTestId(
      `${fieldTestId}-menu-type-${newType}`,
    );
    await expect(typeOption).toBeInTheDocument();
  });

  await userEvent.click(
    screen.getByTestId(`${fieldTestId}-menu-type-${newType}`),
  );
};

export const changeArrayItemsType = async (
  canvas: Canvas,
  arrayFieldTestId: string,
  newType: SchemaType,
) => {
  // Array items type button is at the same level as field type button
  // but there are two - we need to click the second one (items type)
  const typeButtons = canvas.getAllByTestId(
    `${arrayFieldTestId}-select-type-button`,
  );
  if (typeButtons.length < 2) {
    throw new Error('Array items type button not found');
  }
  // Items type is the one showing "string" by default, not "array"
  const itemsTypeButton = typeButtons.find(
    (btn: HTMLElement) => btn.textContent !== 'array',
  );
  if (!itemsTypeButton) {
    throw new Error('Items type button not found');
  }
  await userEvent.click(itemsTypeButton);

  await waitFor(async () => {
    const typeOption = screen.getByTestId(
      `${arrayFieldTestId}-menu-type-${newType}`,
    );
    await expect(typeOption).toBeInTheDocument();
  });

  await userEvent.click(
    screen.getByTestId(`${arrayFieldTestId}-menu-type-${newType}`),
  );
};

// ============ METADATA OPERATIONS ============

export const openSettingsMenu = async (canvas: Canvas, fieldTestId: string) => {
  const settingsButton = await canvas.findByTestId(
    `${fieldTestId}-setting-button`,
  );
  await userEvent.click(settingsButton);
};

export const setFormula = async (
  canvas: Canvas,
  fieldTestId: string,
  formula: string,
) => {
  await openSettingsMenu(canvas, fieldTestId);

  await waitFor(async () => {
    const formulaOption = screen.getByText(/Formula/i);
    await expect(formulaOption).toBeInTheDocument();
  });

  await userEvent.click(screen.getByText(/Formula/i));

  // Find formula input and type formula
  // testId format: {fieldTestId}-setting-button-formula-input
  const formulaInputTestId = `${fieldTestId}-setting-button-formula-input`;
  await waitFor(async () => {
    const formulaInput = screen.getByTestId(formulaInputTestId);
    await expect(formulaInput).toBeInTheDocument();
  });

  const formulaInput = screen.getByTestId(formulaInputTestId);
  await userEvent.clear(formulaInput);
  await userEvent.type(formulaInput, formula);

  // Close menu
  await userEvent.click(document.body);
};

export const setDescription = async (
  canvas: Canvas,
  fieldTestId: string,
  description: string,
) => {
  await openSettingsMenu(canvas, fieldTestId);

  await waitFor(async () => {
    const descOption = screen.getByText(/Description/i);
    await expect(descOption).toBeInTheDocument();
  });

  await userEvent.click(screen.getByText(/Description/i));

  const descInputTestId = `${fieldTestId}-setting-button-description-input`;
  const descInput = screen.getByTestId(descInputTestId);
  await userEvent.clear(descInput);
  await userEvent.type(descInput, description);

  await userEvent.click(document.body);
};

export const setDeprecated = async (canvas: Canvas, fieldTestId: string) => {
  await openSettingsMenu(canvas, fieldTestId);

  await waitFor(async () => {
    const deprecatedOption = screen.getByText(/Deprecated/i);
    await expect(deprecatedOption).toBeInTheDocument();
  });

  await userEvent.click(screen.getByText(/Deprecated/i));
};

export const setDefaultValue = async (
  canvas: Canvas,
  fieldTestId: string,
  value: string,
) => {
  await openSettingsMenu(canvas, fieldTestId);

  await waitFor(async () => {
    const defaultOption = screen.getByText(/Default/i);
    await expect(defaultOption).toBeInTheDocument();
  });

  await userEvent.click(screen.getByText(/Default/i));

  const defaultInputTestId = `${fieldTestId}-setting-button-default-input`;
  const defaultInput = screen.getByTestId(defaultInputTestId);
  await userEvent.clear(defaultInput);
  await userEvent.type(defaultInput, value);

  await userEvent.click(document.body);
};

// ============ DIALOG OPERATIONS ============

export const clickCreateTableButton = async (canvas: Canvas) => {
  const createButton = await canvas.findByTestId('schema-editor-create-button');
  await userEvent.click(createButton);
};

export const clickApplyChangesButton = async (canvas: Canvas) => {
  const applyButton = await canvas.findByTestId('schema-editor-approve-button');
  await userEvent.click(applyButton);
};

export const confirmCreateTable = async () => {
  await waitFor(async () => {
    const dialogButton = screen.getByRole('button', { name: 'Create Table' });
    await expect(dialogButton).toBeInTheDocument();
  });

  await userEvent.click(screen.getByRole('button', { name: 'Create Table' }));
};

export const confirmApplyChanges = async () => {
  await waitFor(async () => {
    const dialogButton = screen.getByRole('button', { name: /Apply Changes/ });
    await expect(dialogButton).toBeInTheDocument();
  });

  await userEvent.click(screen.getByRole('button', { name: /Apply Changes/ }));
};

// ============ TABLE NAME OPERATIONS ============

export const changeTableName = async (canvas: Canvas, newName: string) => {
  const tableNameInput = await canvas.findByTestId('table-name-input');
  await userEvent.clear(tableNameInput);
  await userEvent.type(tableNameInput, newName);
};

// ============ DRAG AND DROP ============

export const dragAndDrop = async (
  canvas: Canvas,
  sourceTestId: string,
  targetTestId: string,
) => {
  const source = canvas.getByTestId(sourceTestId);
  const target = canvas.getByTestId(`${targetTestId}-drop`);

  // Simulate drag and drop
  await userEvent.pointer([
    { keys: '[MouseLeft>]', target: source },
    { target: target },
    { keys: '[/MouseLeft]' },
  ]);
};

// ============ FOREIGN KEY ============

export const selectForeignKey = async (
  canvas: Canvas,
  fieldTestId: string,
  tableName: string,
) => {
  const connectButton = await canvas.findByTestId(
    `${fieldTestId}-connect-foreign-key`,
  );
  await userEvent.click(connectButton);

  await waitFor(async () => {
    const tableButton = screen.getByRole('button', { name: tableName });
    await expect(tableButton).toBeInTheDocument();
  });

  await userEvent.click(screen.getByRole('button', { name: tableName }));
};

// ============ EXPAND/COLLAPSE ============

export const expandField = async (canvas: Canvas, fieldTestId: string) => {
  const expandButton = await canvas.findByTestId(
    `${fieldTestId}-expand-button`,
  );
  await userEvent.click(expandButton);
};

export const collapseField = async (canvas: Canvas, fieldTestId: string) => {
  const collapseButton = await canvas.findByTestId(
    `${fieldTestId}-collapse-button`,
  );
  await userEvent.click(collapseButton);
};
