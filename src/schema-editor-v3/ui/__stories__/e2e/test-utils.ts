import {
  screen,
  userEvent,
  waitFor,
  expect,
  within,
  fireEvent,
} from 'storybook/test';

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
  // Open the settings menu first
  await openSettingsMenu(canvas, fieldTestId);

  // Wait for and click the delete option
  const deleteTestId = `${fieldTestId}-setting-button-delete`;
  await waitFor(async () => {
    const deleteOption = screen.getByTestId(deleteTestId);
    await expect(deleteOption).toBeInTheDocument();
  });

  await userEvent.click(screen.getByTestId(deleteTestId));
};

// ============ TYPE OPERATIONS ============

export type SchemaType =
  | 'String'
  | 'Number'
  | 'Boolean'
  | 'Object'
  | 'Array'
  | 'ForeignKeyString'
  | 'File'
  | 'Markdown'
  | 'RowId'
  | 'RowCreatedAt'
  | 'RowUpdatedAt'
  | 'RowPublishedAt'
  | 'RowCreatedId'
  | 'RowVersionId'
  | 'RowHash'
  | 'RowSchemaHash';

const SCHEMAS_SUBMENU_TYPES = new Set(['File', 'Markdown']);

const SYSTEM_FIELDS_SUBMENU_TYPES = new Set([
  'RowId',
  'RowCreatedAt',
  'RowUpdatedAt',
  'RowPublishedAt',
  'RowCreatedId',
  'RowVersionId',
  'RowHash',
  'RowSchemaHash',
]);

export const changeType = async (
  canvas: Canvas,
  fieldTestId: string,
  newType: SchemaType,
) => {
  const typeButton = await canvas.findByTestId(
    `${fieldTestId}-select-type-button`,
  );
  await userEvent.click(typeButton);

  if (SCHEMAS_SUBMENU_TYPES.has(newType)) {
    // First open Schemas submenu
    const submenuTriggerId = `${fieldTestId}-menu-submenu-schemas-submenu`;
    await waitFor(async () => {
      const trigger = screen.getByTestId(submenuTriggerId);
      await expect(trigger).toBeInTheDocument();
    });
    await userEvent.click(screen.getByTestId(submenuTriggerId));

    // Then click the type option
    const testId = `${fieldTestId}-menu-sub-${newType}`;
    await waitFor(async () => {
      const typeOption = screen.getByTestId(testId);
      await expect(typeOption).toBeInTheDocument();
    });
    await userEvent.click(screen.getByTestId(testId));
  } else if (SYSTEM_FIELDS_SUBMENU_TYPES.has(newType)) {
    // First open System fields submenu
    const submenuTriggerId = `${fieldTestId}-menu-submenu-system-fields-submenu`;
    await waitFor(async () => {
      const trigger = screen.getByTestId(submenuTriggerId);
      await expect(trigger).toBeInTheDocument();
    });
    await userEvent.click(screen.getByTestId(submenuTriggerId));

    // Then click the type option
    const testId = `${fieldTestId}-menu-sub-${newType}`;
    await waitFor(async () => {
      const typeOption = screen.getByTestId(testId);
      await expect(typeOption).toBeInTheDocument();
    });
    await userEvent.click(screen.getByTestId(testId));
  } else {
    await waitFor(async () => {
      const typeOption = screen.getByTestId(
        `${fieldTestId}-menu-type-${newType}`,
      );
      await expect(typeOption).toBeInTheDocument();
    });
    await userEvent.click(
      screen.getByTestId(`${fieldTestId}-menu-type-${newType}`),
    );
  }
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

  // TypeMenu in ArrayItemsView uses arrayFieldTestId for menu items
  if (SCHEMAS_SUBMENU_TYPES.has(newType)) {
    // First open Schemas submenu
    const submenuTriggerId = `${arrayFieldTestId}-menu-submenu-schemas-submenu`;
    await waitFor(async () => {
      const trigger = screen.getByTestId(submenuTriggerId);
      await expect(trigger).toBeInTheDocument();
    });
    await userEvent.click(screen.getByTestId(submenuTriggerId));

    // Then click the type option
    const testId = `${arrayFieldTestId}-menu-sub-${newType}`;
    await waitFor(async () => {
      const typeOption = screen.getByTestId(testId);
      await expect(typeOption).toBeInTheDocument();
    });
    await userEvent.click(screen.getByTestId(testId));
  } else if (SYSTEM_FIELDS_SUBMENU_TYPES.has(newType)) {
    // First open System fields submenu
    const submenuTriggerId = `${arrayFieldTestId}-menu-submenu-system-fields-submenu`;
    await waitFor(async () => {
      const trigger = screen.getByTestId(submenuTriggerId);
      await expect(trigger).toBeInTheDocument();
    });
    await userEvent.click(screen.getByTestId(submenuTriggerId));

    // Then click the type option
    const testId = `${arrayFieldTestId}-menu-sub-${newType}`;
    await waitFor(async () => {
      const typeOption = screen.getByTestId(testId);
      await expect(typeOption).toBeInTheDocument();
    });
    await userEvent.click(screen.getByTestId(testId));
  } else {
    await waitFor(async () => {
      const typeOption = screen.getByTestId(
        `${arrayFieldTestId}-menu-type-${newType}`,
      );
      await expect(typeOption).toBeInTheDocument();
    });

    await userEvent.click(
      screen.getByTestId(`${arrayFieldTestId}-menu-type-${newType}`),
    );
  }
};

// ============ METADATA OPERATIONS ============

export const openSettingsMenu = async (canvas: Canvas, fieldTestId: string) => {
  const settingsButton = await canvas.findByTestId(
    `${fieldTestId}-setting-button`,
  );
  await userEvent.click(settingsButton);
};

export const openArrayItemsSettingsMenu = async (
  canvas: Canvas,
  arrayFieldTestId: string,
) => {
  const settingsButton = await canvas.findByTestId(
    `${arrayFieldTestId}-items-setting-button`,
  );
  await userEvent.click(settingsButton);
};

export const setFormula = async (
  canvas: Canvas,
  fieldTestId: string,
  formula: string,
) => {
  await openSettingsMenu(canvas, fieldTestId);

  const formulaMenuTestId = `${fieldTestId}-setting-button-formula-menu`;
  await waitFor(async () => {
    const formulaOption = screen.getByTestId(formulaMenuTestId);
    await expect(formulaOption).toBeInTheDocument();
  });

  await userEvent.click(screen.getByTestId(formulaMenuTestId));

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

export const setArrayItemsFormula = async (
  canvas: Canvas,
  arrayFieldTestId: string,
  formula: string,
) => {
  await openArrayItemsSettingsMenu(canvas, arrayFieldTestId);

  const formulaMenuTestId = `${arrayFieldTestId}-items-setting-button-formula-menu`;
  await waitFor(async () => {
    const formulaOption = screen.getByTestId(formulaMenuTestId);
    await expect(formulaOption).toBeInTheDocument();
  });

  await userEvent.click(screen.getByTestId(formulaMenuTestId));

  const formulaInputTestId = `${arrayFieldTestId}-items-setting-button-formula-input`;
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

  const descMenuTestId = `${fieldTestId}-setting-button-description-menu`;
  await waitFor(async () => {
    const descOption = screen.getByTestId(descMenuTestId);
    await expect(descOption).toBeInTheDocument();
  });

  await userEvent.click(screen.getByTestId(descMenuTestId));

  const descInputTestId = `${fieldTestId}-setting-button-description-input`;
  await waitFor(async () => {
    const descInput = screen.getByTestId(descInputTestId);
    await expect(descInput).toBeInTheDocument();
  });

  const descInput = screen.getByTestId(descInputTestId);
  await userEvent.clear(descInput);
  await userEvent.type(descInput, description);

  await userEvent.click(document.body);
};

export const setArrayItemsDescription = async (
  canvas: Canvas,
  arrayFieldTestId: string,
  description: string,
) => {
  await openArrayItemsSettingsMenu(canvas, arrayFieldTestId);

  const descMenuTestId = `${arrayFieldTestId}-items-setting-button-description-menu`;
  await waitFor(async () => {
    const descOption = screen.getByTestId(descMenuTestId);
    await expect(descOption).toBeInTheDocument();
  });

  await userEvent.click(screen.getByTestId(descMenuTestId));

  const descInputTestId = `${arrayFieldTestId}-items-setting-button-description-input`;
  await waitFor(async () => {
    const descInput = screen.getByTestId(descInputTestId);
    await expect(descInput).toBeInTheDocument();
  });

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

  const defaultMenuTestId = `${fieldTestId}-setting-button-default-menu`;
  await waitFor(async () => {
    const defaultOption = screen.getByTestId(defaultMenuTestId);
    await expect(defaultOption).toBeInTheDocument();
  });

  await userEvent.click(screen.getByTestId(defaultMenuTestId));

  const defaultInputTestId = `${fieldTestId}-setting-button-default-input`;
  await waitFor(async () => {
    const defaultInput = screen.getByTestId(defaultInputTestId);
    await expect(defaultInput).toBeInTheDocument();
  });

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

const findDraggableElement = (element: Element): HTMLElement | null => {
  let current: Element | null = element;
  while (current) {
    if (
      current instanceof HTMLElement &&
      current.getAttribute('draggable') === 'true'
    ) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
};

export const dragAndDrop = async (
  canvas: Canvas,
  sourceFieldTestId: string,
  targetFieldTestId: string,
) => {
  // Close any open tooltips by clicking away
  await userEvent.click(document.body);
  await new Promise((r) => setTimeout(r, 100));

  // Find the draggable element (the one with draggable="true")
  const dragHandle = canvas.getByTestId(`${sourceFieldTestId}-drag-button`);
  const draggableElement = findDraggableElement(dragHandle);
  if (!draggableElement) {
    throw new Error(
      `No draggable element found for ${sourceFieldTestId}-drag-button`,
    );
  }

  // Get element positions
  const sourceRect = draggableElement.getBoundingClientRect();

  // Use fireEvent from testing-library which properly creates native-like events
  // The library listens on document for drag events

  // 1. Fire dragstart on the draggable element
  fireEvent.dragStart(draggableElement, {
    clientX: sourceRect.left + sourceRect.width / 2,
    clientY: sourceRect.top + sourceRect.height / 2,
  });

  // Wait for the library to process dragstart and show drop targets
  await new Promise((r) => setTimeout(r, 100));

  // 2. Wait for drop target to appear
  await waitFor(async () => {
    const dropTarget = canvas.getByTestId(`${targetFieldTestId}-drop`);
    await expect(dropTarget).toBeInTheDocument();
  });

  const dropTarget = canvas.getByTestId(`${targetFieldTestId}-drop`);
  const dropRect = dropTarget.getBoundingClientRect();

  // 3. Fire dragenter on the drop target
  fireEvent.dragEnter(dropTarget, {
    clientX: dropRect.left + dropRect.width / 2,
    clientY: dropRect.top + dropRect.height / 2,
  });

  // 4. Fire dragover (needed to enable drop)
  fireEvent.dragOver(dropTarget, {
    clientX: dropRect.left + dropRect.width / 2,
    clientY: dropRect.top + dropRect.height / 2,
  });

  await new Promise((r) => setTimeout(r, 50));

  // 5. Fire drop on the target
  fireEvent.drop(dropTarget, {
    clientX: dropRect.left + dropRect.width / 2,
    clientY: dropRect.top + dropRect.height / 2,
  });

  // 6. Fire dragend on source
  fireEvent.dragEnd(draggableElement, {
    clientX: sourceRect.left + sourceRect.width / 2,
    clientY: sourceRect.top + sourceRect.height / 2,
  });

  // Wait for UI update
  await new Promise((r) => setTimeout(r, 200));
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

// ============ BOOLEAN DEFAULT VALUE ============

export const setBooleanDefaultValue = async (
  canvas: Canvas,
  fieldTestId: string,
  value: boolean,
) => {
  await openSettingsMenu(canvas, fieldTestId);

  const defaultMenuTestId = `${fieldTestId}-setting-button-default-menu`;
  await waitFor(async () => {
    const defaultOption = screen.getByTestId(defaultMenuTestId);
    await expect(defaultOption).toBeInTheDocument();
  });

  await userEvent.click(screen.getByTestId(defaultMenuTestId));

  const checkboxTestId = `${fieldTestId}-setting-button-default-checkbox`;
  await waitFor(async () => {
    const checkbox = screen.getByTestId(checkboxTestId);
    await expect(checkbox).toBeInTheDocument();
  });

  const checkbox = screen.getByTestId(checkboxTestId);
  const isChecked = checkbox.getAttribute('data-state') === 'checked';

  if (isChecked !== value) {
    await userEvent.click(checkbox);
  }

  await userEvent.click(document.body);
};

// ============ INDICATOR HELPERS ============

export const hoverOnField = async (canvas: Canvas, fieldTestId: string) => {
  const field = canvas.getByTestId(fieldTestId);
  await userEvent.hover(field);
};

export const expectFormulaIndicator = async (
  canvas: Canvas,
  fieldTestId: string,
) => {
  const fieldRow = canvas.getByTestId(fieldTestId).closest('[class*="Flex"]');
  if (!fieldRow) throw new Error('Field row not found');

  await waitFor(() => {
    const formulaIcon = fieldRow.querySelector('[data-tooltip]');
    expect(formulaIcon).toBeTruthy();
  });
};

export const expectDescriptionIndicator = async (
  canvas: Canvas,
  fieldTestId: string,
) => {
  await hoverOnField(canvas, fieldTestId);
  await waitFor(() => {
    const descIcon = document.querySelector('[aria-label*="description"]');
    expect(descIcon).toBeTruthy();
  });
};

export const expectErrorIndicator = async (
  canvas: Canvas,
  fieldTestId: string,
) => {
  await waitFor(() => {
    const errorIndicator = canvas.queryByTestId(
      `${fieldTestId}-error-indicator`,
    );
    expect(errorIndicator).toBeTruthy();
  });
};

export const expectNoErrorIndicator = async (
  canvas: Canvas,
  fieldTestId: string,
) => {
  await waitFor(() => {
    const errorIndicator = canvas.queryByTestId(
      `${fieldTestId}-error-indicator`,
    );
    expect(errorIndicator).toBeFalsy();
  });
};

// ============ DRAG ICON HELPERS ============

export const expectDragIcon = async (canvas: Canvas, fieldTestId: string) => {
  await hoverOnField(canvas, fieldTestId);
  await waitFor(async () => {
    const dragButton = canvas.queryByTestId(`${fieldTestId}-drag-button`);
    await expect(dragButton).toBeInTheDocument();
  });
};

export const expectNoDragIcon = async (canvas: Canvas, fieldTestId: string) => {
  await hoverOnField(canvas, fieldTestId);
  await waitFor(async () => {
    const dragButton = canvas.queryByTestId(`${fieldTestId}-drag-button`);
    await expect(dragButton).not.toBeInTheDocument();
  });
};

// ============ COLLAPSED/EXPANDED STATE ============

export const expectCollapsed = async (canvas: Canvas, fieldTestId: string) => {
  await waitFor(async () => {
    const expandButton = canvas.queryByTestId(`${fieldTestId}-expand-button`);
    await expect(expandButton).toBeInTheDocument();
  });
};

export const expectExpanded = async (canvas: Canvas, fieldTestId: string) => {
  await waitFor(async () => {
    const collapseButton = canvas.queryByTestId(
      `${fieldTestId}-collapse-button`,
    );
    await expect(collapseButton).toBeInTheDocument();
  });
};

// ============ READONLY STATE ============

export const expectReadonly = async (canvas: Canvas, fieldTestId: string) => {
  await waitFor(async () => {
    const typeLabel = canvas.queryByTestId(`${fieldTestId}-type-label`);
    await expect(typeLabel).toBeInTheDocument();
  });
};

export const expectEditable = async (canvas: Canvas, fieldTestId: string) => {
  await waitFor(async () => {
    const typeButton = canvas.queryByTestId(
      `${fieldTestId}-select-type-button`,
    );
    await expect(typeButton).toBeInTheDocument();
  });
};

export const expectTypeLabel = async (
  canvas: Canvas,
  fieldTestId: string,
  expectedLabel: string,
) => {
  await waitFor(async () => {
    const typeLabel = canvas.queryByTestId(`${fieldTestId}-type-label`);
    const typeButton = canvas.queryByTestId(
      `${fieldTestId}-select-type-button`,
    );
    const element = typeLabel ?? typeButton;
    await expect(element).toBeInTheDocument();
    await expect(element?.textContent).toBe(expectedLabel);
  });
};
