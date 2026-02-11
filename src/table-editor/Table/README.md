# Table Editor — Cell Interaction Architecture

## Overview

The table editor provides Excel-like cell interactions: click-to-focus, double-click/Enter/type-to-edit, arrow-key navigation, Tab wrapping, copy/paste, Delete-to-clear, Enter-move-down, row selection, and multi-cell range selection.

## Architecture

### CellFSM (singleton per table)

A finite-state machine that owns **all** focus/edit/selection state for the entire table. One instance is shared across every cell.

### CellVM (one per cell)

A thin view-model that reads the FSM to derive its own `isFocused`, `isEditing`, `isInSelection` state and delegates actions back to the FSM. Created lazily by `RowVM.getCellVM()` and cached per column field.

### CellWrapper (React component)

Renders the cell container with state-dependent styles, handles mouse and keyboard events, delegates everything to `CellVM`.

## FSM States

```
idle ──FOCUS──▶ focused ──DOUBLE_CLICK/ENTER/TYPE_CHAR──▶ editing
                  ▲                                          │
                  └──────── COMMIT / CANCEL ─────────────────┘
                  │
                  ▼
               (idle) ◀── BLUR
```

| State     | Description                                   |
|-----------|-----------------------------------------------|
| `idle`    | No cell focused. Clicking any cell transitions to `focused`. |
| `focused` | One cell has keyboard focus (blue border ring). Arrow keys navigate, Enter/double-click/typing starts editing. |
| `editing` | The focused cell is in edit mode (input visible). Commit saves value, Cancel reverts, Blur commits and goes idle. |

## Keyboard Shortcuts

### Focused State

| Key            | Action                                      |
|----------------|---------------------------------------------|
| Arrow keys     | Move focus to adjacent cell                 |
| Shift+Arrow    | Extend/start range selection                |
| Tab            | Move focus right, wrap to next row          |
| Shift+Tab      | Move focus left, wrap to previous row       |
| Enter          | Start editing (if editable)                 |
| Printable char | Start editing with that character (if editable) |
| Delete/Backspace | Clear cell to default value (if editable) |
| Ctrl/Cmd+C     | Copy cell value to clipboard                |
| Ctrl/Cmd+V     | Paste clipboard into cell (if editable)     |
| Escape         | Blur (go to idle)                           |

### Editing State

| Key       | Action                                             |
|-----------|----------------------------------------------------|
| Enter     | Commit value AND move down to next row (enters editing) |
| Escape    | Cancel edit, revert to previous value, stay focused |
| Blur      | Commit value, go to idle                           |

### Range Selected (handled at TableWidget level)

| Key            | Action                                      |
|----------------|---------------------------------------------|
| Ctrl/Cmd+C     | Copy range as TSV to clipboard              |
| Ctrl/Cmd+V     | Paste TSV from clipboard starting at focused cell |
| Delete/Backspace | Clear all editable cells in range to defaults |

## Mouse Interactions

| Action         | Effect                                      |
|----------------|---------------------------------------------|
| Click          | Focus clicked cell, clear any range         |
| Shift+Click    | Extend range from anchor (or current focus) to clicked cell |
| Double-click   | Start editing (if editable)                 |
| MouseDown+Drag | Set anchor on mouseDown, extend range on mouseEnter |

## Edit Triggers

When entering edit mode, an `EditTrigger` is stored so the cell editor knows how to initialize:

| Trigger       | Behavior                                     |
|---------------|----------------------------------------------|
| `doubleClick` | Open editor with full text selected, cursor at click position |
| `enter`       | Open editor with full text selected          |
| `char`        | Open editor with text replaced by typed character |

## Cell Types

| Type        | Editable | Editor                     |
|-------------|----------|----------------------------|
| String      | Yes      | Textarea (auto-resize)     |
| Number      | Yes      | Number input               |
| Boolean     | Yes      | Toggle true/false buttons  |
| ForeignKey  | No*      | Search dialog              |
| File        | No       | Display only               |
| DateTime    | No       | Display only               |
| Formula     | No       | Readonly (any type)        |

## Copy/Paste

### Single Cell
- **Copy**: `Ctrl+C` on focused cell copies `displayValue` to clipboard
- **Paste**: `Ctrl+V` on focused editable cell parses clipboard text and sets value (type-aware: string trimmed, number parsed, boolean parsed)

### Range (Multi-Cell)
- **Copy**: `Ctrl+C` with range selected copies rectangular block as TSV (tab-separated values, newline-separated rows)
- **Paste**: `Ctrl+V` with range selected pastes TSV grid starting from focused cell position. Out-of-bounds and readonly cells are silently skipped.
- **Delete**: `Delete`/`Backspace` with range clears all editable cells in range to their default values.

## Enter Behavior

When pressing Enter in editing mode:
1. Current value is committed
2. Focus moves down one row in the same column
3. The new cell immediately enters editing mode (if it exists)
4. If already on the last row, stays focused on current cell without entering editing

## Row Selection

Separate from cell focus. Uses `SelectionModel` with checkboxes:
- Toggle individual rows via checkbox
- Select All / Deselect All via toolbar
- Delete selected rows via toolbar button
- Selection mode shows/hides checkbox column

## Range Selection

Range = rectangle defined by **anchor cell** and **focused cell**.

### How it works
1. **Anchor** is set when Shift+Click, Shift+Arrow, or mouseDown starts a drag
2. **Focused cell** moves via Shift+Arrow or mouseEnter during drag
3. Rectangle = `min/max(anchor, focused)` for both row and column indices
4. All cells inside the rectangle get `isInSelection = true` (light blue background)
5. Any non-shift navigation (Click, Arrow, Tab, Enter, typing) clears the anchor and selection

### Visual States

| State            | Background | Border          |
|------------------|------------|-----------------|
| `display`        | white      | none            |
| `focused`        | blue.50    | 2px blue.400    |
| `editing`        | white      | 2px blue.500    |
| `readonly`       | white      | none            |
| `readonlyFocused`| gray.50    | 2px gray.400    |
| `selected`       | blue.50    | none            |
