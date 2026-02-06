# Schema Editor v3 - Keyboard Navigation

## Overview

The schema editor supports terminal-style keyboard navigation for navigating and editing the schema tree without a mouse. The keyboard system has two modes:

- **TREE_NAV** — arrow keys move between nodes, hotkeys trigger actions
- **EDIT_NAME** — a ContentEditable field name input has focus; keyboard navigation is paused

## Key Bindings (TREE_NAV mode)

| Key | Action |
|-----|--------|
| `↑` / `Shift+Tab` | Move to previous visible node |
| `↓` / `Tab` | Move to next visible node |
| `→` | Expand collapsed node, or move to first child |
| `←` | Collapse expanded node, or move to parent |
| `Space` | Toggle expand/collapse |
| `Enter` / `F2` / `i` | Enter EDIT_NAME mode (focus the field name input) |
| `Insert` | Insert new field (see below) |
| `Delete` / `Backspace` | Remove active node |
| `Escape` | Deselect active node (removes empty unnamed nodes) |

## Insert (Insert Field) Logic

- **On an object node** — inserts a new field at position 0 (beginning of the object)
- **On a child of an object** — inserts a new field after the current node (using `insertFieldAt`)
- **On array items or other non-object contexts** — no-op

New fields are created with an empty name and type `string`. The new field automatically receives focus so the user can immediately type a name (mode transitions to EDIT_NAME).

## Active Node & Deactivation

- Clicking on a node's name, type selector, or settings activates it
- Clicking empty space inside the tree container deactivates the active node
- Clicking outside the tree container (back button, mode switcher, etc.) deactivates the active node
- Clicking inside overlay menus (type menu, settings popover) keeps the active node
- Active node is highlighted with `backgroundColor="gray.100"`

## Mode Transitions

| Trigger | Transition |
|---------|------------|
| Field name input gains focus (blur→focus) | TREE_NAV → EDIT_NAME |
| Field name input loses focus (focus→blur) | EDIT_NAME → TREE_NAV, focus returns to container |

## Architecture

### TreeNavigator class

Located at `model/utils/TreeNavigator.ts`. Pure tree-walking logic, reusable by any component that needs to traverse the visible tree.

**Dependencies:** `SchemaModel`, `TreeState`

**Methods:**
- `visibleNodeIds()` — walks the schema tree respecting expanded/collapsed state. Root is always expanded. Returns node IDs in document order.
- `findParentId(nodeId)` — finds the parent of a node by recursive tree search
- `isRootId(nodeId)` — checks if a node is the root
- `getNode(nodeId)` — returns `SchemaNode` by ID
- `nodeHasChildren(node)` — checks if a node has expandable children
- `getFirstChildId(node)` — returns the first child ID of a node

### KeyboardNavigation class

Located at `model/core/KeyboardNavigation.ts`. Composed into `SchemaEditorCore` alongside `CollapseManager` and `ViewState`.

**Dependencies:**
- `TreeState` — manages active node, expanded/collapsed state, focus state
- `TreeNavigator` — provides tree traversal (visible nodes, parent lookup, children)
- `AccessorCache` — provides node accessors for actions (insert, remove)

**Reactions (MobX):**
- Watches `isFocused` on active node — toggles between TREE_NAV and EDIT_NAME

**Native event listener:**
- `mousedown` on `document` — deactivates active node when clicking outside tree nodes or overlay menus. Uses native DOM event (not React synthetic) to avoid capturing React Portal event bubbling from menus.

### UI Integration

The tree section in `SchemaEditor.tsx` is wrapped in a focusable `Box`:
```tsx
<Box
  ref={(el) => vm.tree.keyboard.setContainerRef(el)}
  tabIndex={0}
  onKeyDown={vm.tree.keyboard.handleKeyDown}
/>
```

Each tree node has `data-node-id={accessor.nodeId}` for `scrollIntoView` targeting and click-to-deactivate detection.

### TreeState Additions

- `activeNodeId` — the currently keyboard-selected node
- `focusRequestCount` — monotonically increasing counter per node, used to trigger focus via `useUpdateEffect` in ContentEditable without firing on blur

### NodeState Additions

- `isActive` / `activate()` — delegates to TreeState
- `setFocused(true)` / `setMenuOpen(true)` / `setSettingsOpen(true)` — also activate the node
- `focusRequestCount` / `requestFocus()` — delegates to TreeState

### NodeActions Addition

- `insertFieldAt(index, name)` — calls `schemaModel.insertFieldAt()` for positional field insertion (requires `@revisium/schema-toolkit@0.18.0`)
