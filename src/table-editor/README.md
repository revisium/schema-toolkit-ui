# Table Editor — Cell Interaction Model

## Cell FSM (Finite State Machine)

Each cell has exactly one state at any given time. Only one cell in the entire table can be in `focused` or `editing` state — enforced by `CellFSM` (single source of truth, wraps `ObservableFSM`).

```
┌─────────┐     click        ┌─────────┐    double-click / Enter / char   ┌─────────┐
│  idle   │ ──────────────▶  │ focused │ ──────────────────────────────▶  │ editing │
└─────────┘                  └─────────┘                                  └─────────┘
     ▲                            │  ▲                                     │  │
     │         Escape             │  │          Escape / commit / cancel   │  │
     │◀───────────────────────────┘  └────────────────────────────────────┘  │
     │                                                                       │
     │                        click outside / blur                           │
     └───────────────────────────────────────────────────────────────────────┘
                                             Enter (commit+move down)
                                     editing ──────────────────────▶ editing (next row)
```

### Visual States (CellWrapper)

CellWrapper maps the FSM state + cell properties into a visual state:

| Visual state     | Condition                                        | Visual                                    | DOM focus          |
|------------------|--------------------------------------------------|-------------------------------------------|--------------------|
| `display`        | Not focused, not editing, not readonly, not selected | Default cell, hover highlight             | No (`tabIndex=-1`) |
| `focused`        | FSM focused, no range selection, not readonly    | Blue border (`_before`), blue bg          | Yes (`tabIndex=0`) |
| `editing`        | FSM editing, not readonly                        | Blue border, editor overlay               | Editor has focus   |
| `readonly`       | Cell is readonly, not focused, not selected      | Gray text, default cursor                 | No (`tabIndex=-1`) |
| `readonlyFocused`| Cell is readonly, focused, no range selection    | Gray border, gray bg, "readonly" badge    | Yes (`tabIndex=0`) |
| `selected`       | Cell is in range selection                       | Blue background, cell cursor              | No                 |

### Readonly Cells

Readonly is a property of the cell (`CellVM.isReadOnly`), not an FSM state. Readonly cells **can** be focused (enter `readonlyFocused` visual state) and participate in range selection, but they **cannot** enter `editing` state. When focused, they support navigation (arrows, Tab) and copy (`Ctrl+C`), but not Enter, Delete, or printable character entry.

## State Transitions

### idle → focused

| Trigger            | Action                          |
|--------------------|---------------------------------|
| Click on cell      | `cell.focus()` → `CellFSM.focusCell()` |
| Arrow key from neighbor | `CellFSM.moveUp/Down/Left/Right()` |
| Tab from neighbor  | `CellFSM.handleTab()`   |
| Drag start (mousedown) | `CellFSM.dragStart()` |

Side-effect: If another cell was focused/editing, it is automatically unfocused (CellFSM stores only one focusedCell).

### focused → editing

| Trigger            | Action                          | Cell types       |
|--------------------|---------------------------------|------------------|
| Double-click       | `cell.startEditWithDoubleClick(offset?)` | All editable     |
| Enter key          | `cell.startEdit()`              | String, Number   |
| Printable character | `cell.startEditWithChar(char)` | String, Number   |

For Boolean/ForeignKey cells: only double-click opens the popover editor. Enter and printable characters do not apply.

### editing → focused

| Trigger            | Action                          |
|--------------------|---------------------------------|
| Escape             | `cell.cancelEdit()` (revert value) |
| Blur (click outside editor) | Commit value, `cell.commitEdit()` |

### editing → editing (next row)

| Trigger            | Action                          |
|--------------------|---------------------------------|
| Enter (no Shift)   | Commit value, move focus down, open editing in next cell via `cell.commitEditAndMoveDown()` → `CellFSM.COMMIT_MOVE_DOWN` |

If there is no row below, transitions to `focused` instead.

### focused → idle

| Trigger            | Action                          |
|--------------------|---------------------------------|
| Escape (no range)  | `cell.blur()`                   |
| Click on another cell | Other cell calls `cell.focus()`, CellFSM replaces focusedCell |

### editing → idle

| Trigger            | Action                          |
|--------------------|---------------------------------|
| Click outside (not on another cell) | Textarea blur → commit → CellFSM clears focus |

## Range Selection

CellFSM supports multi-cell range selection via `anchorCell` + `focusedCell`. A range exists when both are set and point to different cells.

### Creating a Range

| Trigger                  | Action                          |
|--------------------------|---------------------------------|
| `Shift+Click` on cell   | `cell.selectTo()` — sets anchor to current focused, moves focus to clicked |
| `Shift+Arrow`            | `cell.shiftMove*()` — extends selection by one cell |
| Mouse drag (mousedown + mousemove) | `cell.dragStart()` + `cell.dragExtend()` |

### Range Visual

- Selected cells render with `selected` visual state (blue background)
- The anchor cell shows a focused border (`_before`) over the selection
- Range borders are drawn via inset `boxShadow` using `buildSelectionBoxShadow()` — shows a blue border around the outer edges of the selection, contained within cell bounds

### Clearing a Range

| Trigger            | Action                          |
|--------------------|---------------------------------|
| `Escape`           | Clears range, keeps focus on current cell |
| Arrow key (no Shift) | Clears range, keeps focus on current cell |
| Click (no Shift)   | Clears range, focuses clicked cell |

## Keyboard Handling

### In `focused` / `readonlyFocused` state (handled by CellWrapper)

| Key              | Action                                |
|------------------|---------------------------------------|
| `ArrowUp`        | Move focus to cell above              |
| `ArrowDown`      | Move focus to cell below              |
| `ArrowLeft`      | Move focus to cell on left            |
| `ArrowRight`     | Move focus to cell on right           |
| `Shift+Arrow`    | Extend/create range selection         |
| `Tab`            | Move focus to next cell (wraps to next row) |
| `Shift+Tab`      | Move focus to previous cell (wraps to previous row) |
| `Enter`          | Enter edit mode (String/Number only)  |
| `Escape`         | Clear range if active, otherwise blur (return to idle) |
| `Delete`/`Backspace` | Clear cell to default value (editable cells only) |
| `Ctrl+C`/`⌘C`   | Copy cell value to clipboard (single cell) |
| `Ctrl+V`/`⌘V`   | Paste — handled by TableWidget (see Copy/Paste) |
| Printable char   | Enter edit mode with char appended (String/Number only) |

When a range is active, unmodified arrow keys clear the range and keep focus. `Delete`/`Backspace`, `Enter`, and printable chars are disabled while a range is active.

### In `editing` state (handled by editor component)

| Key              | Action                                |
|------------------|---------------------------------------|
| `Escape`         | Cancel edit, return to focused        |
| `Enter`          | Commit value, move down to next row and open editing |
| `Shift+Enter`    | Insert newline (String only)          |
| All other keys   | Handled by editor (textarea/popover)  |

### In `idle` state

No keyboard handling. Cell is not focusable.

### Range keyboard (handled by TableWidget)

| Key              | Action                                |
|------------------|---------------------------------------|
| `Ctrl+C`/`⌘C`   | Copy range as TSV to clipboard        |
| `Ctrl+V`/`⌘V`   | Paste TSV from clipboard into range or from focused cell |
| `Delete`/`Backspace` | Clear all cells in range to defaults |

## Mouse Handling

| Action           | State before | Result                             |
|------------------|--------------|------------------------------------|
| Single click     | `idle`       | → `focused`                        |
| Single click     | `focused` (same cell) | No change                  |
| Single click     | `focused` (other cell) | Other cell → `idle`, this cell → `focused` |
| `Shift+Click`    | `focused`    | Creates range from focused to clicked cell |
| Double-click     | `idle`       | → `focused` → `editing` (immediate) |
| Double-click     | `focused`    | → `editing`                        |
| Click outside    | `editing`    | Commit → `idle`                    |
| Click on cell B  | `editing` cell A | Commit A → A to `idle`, B → `focused` |
| Mouse drag       | Any          | First cell → anchor, dragged cells → extend range |

## Copy / Paste

### Single Cell

- `Ctrl+C` in focused state: copies `displayValue` to clipboard via `CellVM.copyToClipboard()`
- `Ctrl+V` in focused state: pastes from clipboard via `TableWidget`, delegates to `CellVM.applyPastedText()` which parses based on cell type (string, number, boolean)

### Range (TSV format)

- `Ctrl+C` with range: copies all cells as tab-separated values, rows separated by newlines
- `Ctrl+V` with range: pastes TSV starting at the top-left of the range
- `Ctrl+V` without range (single focused cell): pastes TSV starting at the focused cell position
- `Delete`/`Backspace` with range: clears all cells in range to default values

Range clipboard operations are handled by `TableWidget` via `copyRangeToClipboard()`, `pasteRangeFromClipboard()`, and `clearRange()` utility functions, using `parseTSV()` to parse pasted text.

## Context Menu

CellWrapper wraps each cell in a Chakra `Menu.Root` + `Menu.ContextTrigger` to provide a right-click context menu via `CellContextMenu`.

### Single Cell Menu

| Item             | Shortcut | Action                            | Disabled when     |
|------------------|----------|-----------------------------------|-------------------|
| Copy value       | `⌘C`    | Copy cell value to clipboard      | Never             |
| Copy JSON path   |          | Copy `rowId/field` path           | Never             |
| Edit             | `Enter`  | Open editor                       | `!cell.isEditable`|
| Paste            | `⌘V`    | Paste from clipboard              | `cell.isReadOnly` |
| Clear            |          | Reset cell to default value       | `cell.isReadOnly` |

### Range Menu (when range is active)

| Item             | Shortcut | Action                            |
|------------------|----------|-----------------------------------|
| Copy             | `⌘C`    | Copy range as TSV                 |
| Paste            | `⌘V`    | Paste TSV into range              |
| Clear            | `Del`   | Clear all cells in range          |

Range actions are provided via `CellContextActionsContext` from `TableWidget`.

## Cell Types & Their Editors

### StringCell / NumberCell — Textarea Editor

- Editor: `CellTextareaEditor` rendered via `<Portal>` with `position: fixed`
- Positioned at cell's viewport coordinates via `getBoundingClientRect()`
- Width matches cell width, height starts at 40px
- StringCell: `autoHeight` (expands up to 3 lines), `allowShiftEnter` (multiline)
- NumberCell: no auto-height, no shift-enter, validates `Number()` on commit
- Supports `clickOffset` (cursor position from double-click x-coordinate)
- Supports `appendChar` (character typed to enter edit mode)
- Enter calls `onCommitEnter` which triggers `commitEditAndMoveDown` (commit + move focus to next row)

### BooleanCell — Popover Editor

- Editor: Chakra Popover with two items ("true" / "false")
- Opens on double-click only
- Click item → commit with boolean value
- Click outside → cancel

### ForeignKeyCell — Popover Editor

- Editor: Chakra Popover with SearchForeignKey component
- Opens on double-click only (requires `onSearchForeignKey` callback)
- Select item → commit with selected ID
- Close → cancel

## Architecture

### CellFSM (Single Source of Truth)

Wraps `ObservableFSM` from `src/lib/fsm/` with typed cell-specific API. Config and types are defined in `cellFSMConfig.ts`.

```
ObservableFSM<CellState, CellEvent, CellFSMContext>
  └── CellFSM (wrapper)
       ├── state: 'idle' | 'focused' | 'editing'
       ├── context.focusedCell: CellAddress | null
       ├── context.anchorCell: CellAddress | null   ← for range selection
       ├── context.editTrigger: EditTrigger | null
       ├── context.columns: string[]       ← for navigation + range bounds
       └── context.rowIds: string[]        ← for navigation + range bounds
```

EditTrigger stores how editing was initiated:

```typescript
type EditTrigger =
  | { type: 'doubleClick'; clickOffset?: number }
  | { type: 'enter' }
  | { type: 'char'; char: string };
```

All state (focused cell, anchor cell, editing flag, edit trigger data) lives in one MobX-observable FSM context. No React `useState` needed for trigger data.

All CellVM instances share the same CellFSM. This guarantees:
- Only one cell can be focused at a time
- Focusing a new cell automatically unfocuses the previous one
- Navigation (arrows/tab) and range selection are centralized

### CellVM (Per-Cell Facade)

Each cell creates a CellVM that delegates state to CellFSM:
- `isFocused` = computed: checks if CellFSM's focusedCell matches this cell's address
- `isEditing` = computed: checks if CellFSM is in editing state for this cell
- `isAnchor` = computed: checks if this cell is the range anchor
- `isInSelection` = computed: checks if this cell is within the selected range
- `selectionEdges` = computed: returns which edges of the range border this cell has
- `hasRangeSelection` = computed: whether any range is active
- `editTrigger` = computed: returns CellFSM's editTrigger when editing
- `focus()`, `startEdit()`, `startEditWithChar()`, `startEditWithDoubleClick()`, `commitEdit()`, `commitEditAndMoveDown()`, `cancelEdit()`, `blur()` = delegates to CellFSM
- `selectTo()`, `shiftMove*()`, `dragStart()`, `dragExtend()` = range selection delegates to CellFSM
- `copyToClipboard()`, `pasteFromClipboard()`, `applyPastedText()`, `clearToDefault()` = clipboard and value operations

### CellWrapper (Shared UI Shell)

Wraps all cell types. Responsibilities:
- Renders visual state (display/focused/editing/readonly/readonlyFocused/selected) via `_before` pseudo-element and `stateStyles`
- Renders range selection borders via inset `boxShadow` (`buildSelectionBoxShadow`)
- Handles click → focus, shift+click → selectTo
- Handles mouse drag (mousedown → dragStart, mouseenter → dragExtend)
- Handles double-click → onDoubleClick callback
- Handles keyboard in focused state (arrows, shift+arrows, tab, enter, escape, delete, chars, ctrl+c)
- Manages DOM focus (auto-focus when focused/readonlyFocused/anchor, blur when idle)
- Wraps cell in `Menu.Root` + `Menu.ContextTrigger` for context menu

Visual state is determined by `getCellState()` (in `cellStyles.ts`), styles by `stateStyles` record.

### TableWidget (Range Operations)

Handles range-level keyboard shortcuts (`Ctrl+C`, `Ctrl+V`, `Delete` for ranges) and provides `CellContextActions` via `CellContextActionsContext` for the context menu.

### Editor Components (Per Cell Type)

Each cell type mounts its own editor when `cell.isEditing` is true:
- StringCell/NumberCell: mount `CellTextareaEditor` (Portal + fixed textarea)
- BooleanCell: mount Chakra Popover (derives `isOpen` from `cell.isEditing`)
- ForeignKeyCell: mount Chakra Popover with SearchForeignKey (derives `isOpen` from `cell.isEditing`)

### Popover Cells Don't Support Keyboard Entry

BooleanCell and ForeignKeyCell only open their editors on double-click. They don't pass `onStartEdit` or `onTypeChar` to CellWrapper, so Enter and printable characters are no-ops in focused state for these cell types.
