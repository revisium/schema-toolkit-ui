import { jest } from '@jest/globals';
import {
  createTableModel,
  resetNodeIdCounter,
  type JsonObjectSchema,
} from '@revisium/schema-toolkit';
import { TreeState } from '../../state/TreeState';
import { AccessorCache } from '../AccessorCache';
import { NodeAccessorFactory, type NodeActionsCallbacks } from '../../accessor';
import { KeyboardNavigation } from '../KeyboardNavigation';
import { SchemaEditorCore } from '../SchemaEditorCore';
import { TreeNavigator } from '../../utils/TreeNavigator';

beforeEach(() => {
  resetNodeIdCounter();
});

const createSchema = (
  properties: Record<string, unknown> = {},
): JsonObjectSchema => ({
  type: 'object',
  properties: properties as JsonObjectSchema['properties'],
  additionalProperties: false,
  required: Object.keys(properties),
});

const stringField = { type: 'string', default: '' };
const numberField = { type: 'number', default: 0 };
const objectField = (
  properties: Record<string, unknown>,
): Record<string, unknown> => ({
  type: 'object',
  properties,
  additionalProperties: false,
  required: Object.keys(properties),
});
const arrayField = (items: unknown): Record<string, unknown> => ({
  type: 'array',
  items,
});

const mockEvent = (key: string, shiftKey = false) => ({
  key,
  shiftKey,
  preventDefault: jest.fn(),
});

const createKeyboard = (schema: JsonObjectSchema) => {
  const tableModel = createTableModel({ tableId: 'test', schema });
  const treeState = new TreeState();
  const callbacks: NodeActionsCallbacks = {
    renameTable: jest.fn(),
    onNodeRemoved: jest.fn(),
    onNodeAdded: jest.fn(),
    onNodeReplaced: jest.fn(),
    selectForeignKey: jest.fn(),
  };

  const accessors = new AccessorCache(
    () => tableModel.schema,
    () => ({
      schemaModel: tableModel.schema,
      treeState,
      getTableId: () => tableModel.tableId,
      getTableIdError: () => null,
      callbacks,
    }),
    new NodeAccessorFactory(),
  );

  const navigator = new TreeNavigator(() => tableModel.schema, treeState);

  const keyboard = new KeyboardNavigation(treeState, navigator, accessors);

  return { keyboard, treeState, tableModel, accessors, callbacks };
};

describe('KeyboardNavigation', () => {
  describe('visibleNodeIds', () => {
    it('should return all nodes when all expanded', () => {
      const { keyboard } = createKeyboard(
        createSchema({
          name: stringField,
          age: numberField,
        }),
      );

      const ids = keyboard.visibleNodeIds;
      expect(ids).toHaveLength(3);
    });

    it('should include nested object children when expanded', () => {
      const { keyboard } = createKeyboard(
        createSchema({
          info: objectField({ city: stringField }),
        }),
      );

      const ids = keyboard.visibleNodeIds;
      expect(ids).toHaveLength(3);
    });

    it('should hide children of collapsed nodes', () => {
      const { keyboard, treeState } = createKeyboard(
        createSchema({
          info: objectField({ city: stringField }),
        }),
      );

      const ids = keyboard.visibleNodeIds;
      const infoId = ids[1];
      expect(infoId).toBeDefined();
      treeState.setExpanded(infoId as string, false);

      const collapsedIds = keyboard.visibleNodeIds;
      expect(collapsedIds).toHaveLength(2);
    });

    it('should always show root children even when root is collapsed', () => {
      const { keyboard, treeState, tableModel } = createKeyboard(
        createSchema({
          name: stringField,
        }),
      );

      const rootId = tableModel.schema.root.id();
      treeState.setExpanded(rootId, false);

      const ids = keyboard.visibleNodeIds;
      expect(ids).toHaveLength(2);
    });

    it('should include array items as visible nodes', () => {
      const { keyboard } = createKeyboard(
        createSchema({
          tags: arrayField(stringField),
        }),
      );

      const ids = keyboard.visibleNodeIds;
      expect(ids).toHaveLength(3);
    });
  });

  describe('ArrowDown navigation', () => {
    it('should activate first node when none active', () => {
      const { keyboard, treeState } = createKeyboard(
        createSchema({ name: stringField }),
      );

      keyboard.handleKeyDown(mockEvent('ArrowDown'));

      expect(treeState.activeNodeId).toBe(keyboard.visibleNodeIds[0]);
    });

    it('should move to next node', () => {
      const { keyboard, treeState } = createKeyboard(
        createSchema({ name: stringField, age: numberField }),
      );

      const ids = keyboard.visibleNodeIds;
      treeState.setActiveNodeId(ids[0] as string);

      keyboard.handleKeyDown(mockEvent('ArrowDown'));

      expect(treeState.activeNodeId).toBe(ids[1]);
    });

    it('should not move past last node', () => {
      const { keyboard, treeState } = createKeyboard(
        createSchema({ name: stringField }),
      );

      const ids = keyboard.visibleNodeIds;
      const lastId = ids[ids.length - 1] as string;
      treeState.setActiveNodeId(lastId);

      keyboard.handleKeyDown(mockEvent('ArrowDown'));

      expect(treeState.activeNodeId).toBe(lastId);
    });
  });

  describe('ArrowUp navigation', () => {
    it('should activate last node when none active', () => {
      const { keyboard, treeState } = createKeyboard(
        createSchema({ name: stringField }),
      );

      keyboard.handleKeyDown(mockEvent('ArrowUp'));

      const ids = keyboard.visibleNodeIds;
      expect(treeState.activeNodeId).toBe(ids[ids.length - 1]);
    });

    it('should move to previous node', () => {
      const { keyboard, treeState } = createKeyboard(
        createSchema({ name: stringField, age: numberField }),
      );

      const ids = keyboard.visibleNodeIds;
      treeState.setActiveNodeId(ids[2] as string);

      keyboard.handleKeyDown(mockEvent('ArrowUp'));

      expect(treeState.activeNodeId).toBe(ids[1]);
    });

    it('should not move before first node', () => {
      const { keyboard, treeState } = createKeyboard(
        createSchema({ name: stringField }),
      );

      const ids = keyboard.visibleNodeIds;
      treeState.setActiveNodeId(ids[0] as string);

      keyboard.handleKeyDown(mockEvent('ArrowUp'));

      expect(treeState.activeNodeId).toBe(ids[0]);
    });
  });

  describe('Tab and Shift+Tab', () => {
    it('Tab should move to next node', () => {
      const { keyboard, treeState } = createKeyboard(
        createSchema({ name: stringField }),
      );

      const ids = keyboard.visibleNodeIds;
      treeState.setActiveNodeId(ids[0] as string);

      keyboard.handleKeyDown(mockEvent('Tab'));

      expect(treeState.activeNodeId).toBe(ids[1]);
    });

    it('Shift+Tab should move to previous node', () => {
      const { keyboard, treeState } = createKeyboard(
        createSchema({ name: stringField }),
      );

      const ids = keyboard.visibleNodeIds;
      treeState.setActiveNodeId(ids[1] as string);

      keyboard.handleKeyDown(mockEvent('Tab', true));

      expect(treeState.activeNodeId).toBe(ids[0]);
    });
  });

  describe('ArrowRight (expand or move to child)', () => {
    it('should expand collapsed node', () => {
      const { keyboard, treeState } = createKeyboard(
        createSchema({
          info: objectField({ city: stringField }),
        }),
      );

      const ids = keyboard.visibleNodeIds;
      const infoId = ids[1] as string;
      treeState.setExpanded(infoId, false);
      treeState.setActiveNodeId(infoId);

      keyboard.handleKeyDown(mockEvent('ArrowRight'));

      expect(treeState.isExpanded(infoId)).toBe(true);
    });

    it('should move to first child when already expanded', () => {
      const { keyboard, treeState } = createKeyboard(
        createSchema({
          info: objectField({ city: stringField }),
        }),
      );

      const ids = keyboard.visibleNodeIds;
      const infoId = ids[1] as string;
      treeState.setActiveNodeId(infoId);

      keyboard.handleKeyDown(mockEvent('ArrowRight'));

      expect(treeState.activeNodeId).toBe(ids[2]);
    });

    it('should do nothing on leaf node', () => {
      const { keyboard, treeState } = createKeyboard(
        createSchema({ name: stringField }),
      );

      const ids = keyboard.visibleNodeIds;
      const nameId = ids[1] as string;
      treeState.setActiveNodeId(nameId);

      keyboard.handleKeyDown(mockEvent('ArrowRight'));

      expect(treeState.activeNodeId).toBe(nameId);
    });

    it('should move to first child on root without toggling expand', () => {
      const { keyboard, treeState, tableModel } = createKeyboard(
        createSchema({
          name: stringField,
        }),
      );

      const rootId = tableModel.schema.root.id();
      treeState.setActiveNodeId(rootId);

      keyboard.handleKeyDown(mockEvent('ArrowRight'));

      const ids = keyboard.visibleNodeIds;
      expect(treeState.activeNodeId).toBe(ids[1]);
    });
  });

  describe('ArrowLeft (collapse or move to parent)', () => {
    it('should collapse expanded node with children', () => {
      const { keyboard, treeState } = createKeyboard(
        createSchema({
          info: objectField({ city: stringField }),
        }),
      );

      const ids = keyboard.visibleNodeIds;
      const infoId = ids[1] as string;
      treeState.setActiveNodeId(infoId);

      keyboard.handleKeyDown(mockEvent('ArrowLeft'));

      expect(treeState.isExpanded(infoId)).toBe(false);
    });

    it('should move to parent when on leaf node', () => {
      const { keyboard, treeState } = createKeyboard(
        createSchema({
          info: objectField({ city: stringField }),
        }),
      );

      const ids = keyboard.visibleNodeIds;
      const cityId = ids[2] as string;
      const infoId = ids[1] as string;
      treeState.setActiveNodeId(cityId);

      keyboard.handleKeyDown(mockEvent('ArrowLeft'));

      expect(treeState.activeNodeId).toBe(infoId);
    });

    it('should move to parent when node is already collapsed', () => {
      const { keyboard, treeState } = createKeyboard(
        createSchema({
          info: objectField({ city: stringField }),
        }),
      );

      const ids = keyboard.visibleNodeIds;
      const infoId = ids[1] as string;
      const rootId = ids[0] as string;
      treeState.setExpanded(infoId, false);
      treeState.setActiveNodeId(infoId);

      keyboard.handleKeyDown(mockEvent('ArrowLeft'));

      expect(treeState.activeNodeId).toBe(rootId);
    });

    it('should not collapse root node', () => {
      const { keyboard, treeState, tableModel } = createKeyboard(
        createSchema({
          name: stringField,
        }),
      );

      const rootId = tableModel.schema.root.id();
      treeState.setActiveNodeId(rootId);

      keyboard.handleKeyDown(mockEvent('ArrowLeft'));

      expect(treeState.isExpanded(rootId)).toBe(true);
      expect(treeState.activeNodeId).toBe(rootId);
    });
  });

  describe('Space (toggle expand)', () => {
    it('should toggle expand on node with children', () => {
      const { keyboard, treeState } = createKeyboard(
        createSchema({
          info: objectField({ city: stringField }),
        }),
      );

      const ids = keyboard.visibleNodeIds;
      const infoId = ids[1] as string;
      treeState.setActiveNodeId(infoId);

      expect(treeState.isExpanded(infoId)).toBe(true);

      keyboard.handleKeyDown(mockEvent(' '));
      expect(treeState.isExpanded(infoId)).toBe(false);

      keyboard.handleKeyDown(mockEvent(' '));
      expect(treeState.isExpanded(infoId)).toBe(true);
    });

    it('should not toggle expand on root node', () => {
      const { keyboard, treeState, tableModel } = createKeyboard(
        createSchema({
          name: stringField,
        }),
      );

      const rootId = tableModel.schema.root.id();
      treeState.setActiveNodeId(rootId);

      expect(treeState.isExpanded(rootId)).toBe(true);

      keyboard.handleKeyDown(mockEvent(' '));
      expect(treeState.isExpanded(rootId)).toBe(true);
    });
  });

  describe('Enter / F2 / i (enter edit mode)', () => {
    it('should request focus on active node via Enter', () => {
      const { keyboard, treeState } = createKeyboard(
        createSchema({ name: stringField }),
      );

      const ids = keyboard.visibleNodeIds;
      treeState.setActiveNodeId(ids[1] as string);

      keyboard.handleKeyDown(mockEvent('Enter'));

      expect(treeState.getFocusRequestCount(ids[1] as string)).toBe(1);
    });

    it('should request focus on active node via F2', () => {
      const { keyboard, treeState } = createKeyboard(
        createSchema({ name: stringField }),
      );

      const ids = keyboard.visibleNodeIds;
      treeState.setActiveNodeId(ids[1] as string);

      keyboard.handleKeyDown(mockEvent('F2'));

      expect(treeState.getFocusRequestCount(ids[1] as string)).toBe(1);
    });

    it('should request focus on active node via i', () => {
      const { keyboard, treeState } = createKeyboard(
        createSchema({ name: stringField }),
      );

      const ids = keyboard.visibleNodeIds;
      treeState.setActiveNodeId(ids[1] as string);

      keyboard.handleKeyDown(mockEvent('i'));

      expect(treeState.getFocusRequestCount(ids[1] as string)).toBe(1);
    });
  });

  describe('Insert (insert field)', () => {
    it('should insert field at beginning when active node is object', () => {
      const { keyboard, treeState, tableModel } = createKeyboard(
        createSchema({
          name: stringField,
        }),
      );

      const rootId = tableModel.schema.root.id();
      treeState.setActiveNodeId(rootId);

      const propsBefore = tableModel.schema.root.properties().length;

      keyboard.handleKeyDown(mockEvent('Insert'));

      const propsAfter = tableModel.schema.root.properties().length;
      expect(propsAfter).toBe(propsBefore + 1);
      expect(tableModel.schema.root.properties()[0]?.name()).toBe('');
    });

    it('should insert field after current when active node has object parent', () => {
      const { keyboard, treeState, tableModel } = createKeyboard(
        createSchema({
          name: stringField,
          age: numberField,
        }),
      );

      const props = tableModel.schema.root.properties();
      const firstProp = props[0];
      expect(firstProp).toBeDefined();
      const firstName = firstProp!.name();
      treeState.setActiveNodeId(firstProp!.id());

      keyboard.handleKeyDown(mockEvent('Insert'));

      const updatedProps = tableModel.schema.root.properties();
      expect(updatedProps).toHaveLength(3);
      expect(updatedProps[0]?.name()).toBe(firstName);
      expect(updatedProps[1]?.name()).toBe('');
    });

    it('should not insert field on array items node', () => {
      const { keyboard, treeState, tableModel } = createKeyboard(
        createSchema({
          tags: arrayField(stringField),
        }),
      );

      const tagsNode = tableModel.schema.root.properties()[0];
      expect(tagsNode).toBeDefined();
      const itemsNode = tagsNode!.items();
      treeState.setActiveNodeId(itemsNode.id());

      keyboard.handleKeyDown(mockEvent('Insert'));

      expect(tableModel.schema.root.properties()).toHaveLength(1);
    });
  });

  describe('handleEditEnter (Enter in EDIT_NAME mode)', () => {
    it('should insert field when called on object node', () => {
      const { keyboard, treeState, tableModel } = createKeyboard(
        createSchema({
          name: stringField,
        }),
      );

      const rootId = tableModel.schema.root.id();
      treeState.setActiveNodeId(rootId);

      const propsBefore = tableModel.schema.root.properties().length;

      keyboard.handleEditEnter();

      const propsAfter = tableModel.schema.root.properties().length;
      expect(propsAfter).toBe(propsBefore + 1);
    });

    it('should insert field after current node', () => {
      const { keyboard, treeState, tableModel } = createKeyboard(
        createSchema({
          name: stringField,
          age: numberField,
        }),
      );

      const firstProp = tableModel.schema.root.properties()[0];
      expect(firstProp).toBeDefined();
      treeState.setActiveNodeId(firstProp!.id());

      keyboard.handleEditEnter();

      const updatedProps = tableModel.schema.root.properties();
      expect(updatedProps).toHaveLength(3);
      const names = updatedProps.map((p) => p.name());
      expect(names).toContain('');
    });
  });

  describe('Delete / Backspace (remove node)', () => {
    it('should remove node and activate next', () => {
      const { keyboard, treeState, tableModel } = createKeyboard(
        createSchema({
          name: stringField,
          age: numberField,
        }),
      );

      const nameNode = tableModel.schema.root.properties()[0];
      expect(nameNode).toBeDefined();
      treeState.setActiveNodeId(nameNode!.id());

      keyboard.handleKeyDown(mockEvent('Delete'));

      expect(tableModel.schema.root.properties()).toHaveLength(1);
      expect(treeState.activeNodeId).not.toBeNull();
    });

    it('should not remove root node', () => {
      const { keyboard, treeState, tableModel } = createKeyboard(
        createSchema({ name: stringField }),
      );

      const rootId = tableModel.schema.root.id();
      treeState.setActiveNodeId(rootId);

      keyboard.handleKeyDown(mockEvent('Delete'));

      expect(tableModel.schema.root.properties()).toHaveLength(1);
    });
  });

  describe('Escape (deselect or remove empty)', () => {
    it('should deselect active node with name', () => {
      const { keyboard, treeState } = createKeyboard(
        createSchema({ name: stringField }),
      );

      const ids = keyboard.visibleNodeIds;
      treeState.setActiveNodeId(ids[0] as string);

      keyboard.handleKeyDown(mockEvent('Escape'));

      expect(treeState.activeNodeId).toBeNull();
    });

    it('should remove empty-named node on Escape', () => {
      const { keyboard, treeState, tableModel } = createKeyboard(
        createSchema({ name: stringField }),
      );

      const rootId = tableModel.schema.root.id();
      treeState.setActiveNodeId(rootId);

      keyboard.handleKeyDown(mockEvent('Insert'));

      const emptyNode = tableModel.schema.root.properties()[0];
      expect(emptyNode).toBeDefined();
      expect(emptyNode!.name()).toBe('');
      treeState.setActiveNodeId(emptyNode!.id());

      const propsBefore = tableModel.schema.root.properties().length;

      keyboard.handleKeyDown(mockEvent('Escape'));

      expect(tableModel.schema.root.properties()).toHaveLength(propsBefore - 1);
    });

    it('should not remove root node with empty name on Escape', () => {
      const { keyboard, treeState, tableModel } = createKeyboard(
        createSchema({ name: stringField }),
      );

      const rootId = tableModel.schema.root.id();
      treeState.setActiveNodeId(rootId);

      keyboard.handleKeyDown(mockEvent('Escape'));

      expect(treeState.activeNodeId).toBeNull();
      expect(tableModel.schema.root.isNull()).toBe(false);
    });
  });

  describe('mode transitions', () => {
    it('should start in TREE_NAV mode', () => {
      const { keyboard } = createKeyboard(createSchema({ name: stringField }));

      expect(keyboard.mode).toBe('TREE_NAV');
    });

    it('should switch to EDIT_NAME when isFocused becomes true', () => {
      const { keyboard, treeState } = createKeyboard(
        createSchema({ name: stringField }),
      );

      const ids = keyboard.visibleNodeIds;
      treeState.setActiveNodeId(ids[1] as string);
      treeState.setFocused(ids[1] as string, true);

      expect(keyboard.mode).toBe('EDIT_NAME');
    });

    it('should switch back to TREE_NAV when isFocused becomes false', () => {
      const { keyboard, treeState } = createKeyboard(
        createSchema({ name: stringField }),
      );

      const ids = keyboard.visibleNodeIds;
      treeState.setActiveNodeId(ids[1] as string);
      treeState.setFocused(ids[1] as string, true);
      treeState.setFocused(ids[1] as string, false);

      expect(keyboard.mode).toBe('TREE_NAV');
    });

    it('should keep node active when Escape exits EDIT_NAME mode', () => {
      const { keyboard, treeState } = createKeyboard(
        createSchema({ name: stringField }),
      );

      const ids = keyboard.visibleNodeIds;
      const nodeId = ids[1] as string;
      treeState.setActiveNodeId(nodeId);
      treeState.setFocused(nodeId, true);

      expect(keyboard.mode).toBe('EDIT_NAME');

      treeState.setFocused(nodeId, false);

      expect(keyboard.mode).toBe('TREE_NAV');

      keyboard.handleKeyDown(mockEvent('Escape'));

      expect(treeState.activeNodeId).toBe(nodeId);
    });

    it('should deselect on second Escape after exiting EDIT_NAME mode', () => {
      const { keyboard, treeState } = createKeyboard(
        createSchema({ name: stringField }),
      );

      const ids = keyboard.visibleNodeIds;
      const nodeId = ids[1] as string;
      treeState.setActiveNodeId(nodeId);
      treeState.setFocused(nodeId, true);
      treeState.setFocused(nodeId, false);

      keyboard.handleKeyDown(mockEvent('Escape'));
      expect(treeState.activeNodeId).toBe(nodeId);

      keyboard.handleKeyDown(mockEvent('Escape'));
      expect(treeState.activeNodeId).toBeNull();
    });

    it('should not process key events in EDIT_NAME mode', () => {
      const { keyboard, treeState } = createKeyboard(
        createSchema({
          name: stringField,
          age: numberField,
        }),
      );

      const ids = keyboard.visibleNodeIds;
      treeState.setActiveNodeId(ids[1] as string);
      treeState.setFocused(ids[1] as string, true);

      const event = mockEvent('ArrowDown');
      keyboard.handleKeyDown(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(treeState.activeNodeId).toBe(ids[1]);
    });
  });

  describe('handleNodeAdded', () => {
    it('should set active node to new node', () => {
      const { keyboard, treeState } = createKeyboard(
        createSchema({ name: stringField }),
      );

      keyboard.handleNodeAdded('new-node-id');

      expect(treeState.activeNodeId).toBe('new-node-id');
    });
  });

  describe('handleNodeReplaced', () => {
    it('should update active node when replaced', () => {
      const { keyboard, treeState } = createKeyboard(
        createSchema({ name: stringField }),
      );

      treeState.setActiveNodeId('old-id');
      keyboard.handleNodeReplaced('old-id', 'new-id');

      expect(treeState.activeNodeId).toBe('new-id');
    });

    it('should not change active node when different node replaced', () => {
      const { keyboard, treeState } = createKeyboard(
        createSchema({ name: stringField }),
      );

      treeState.setActiveNodeId('current-id');
      keyboard.handleNodeReplaced('other-id', 'new-id');

      expect(treeState.activeNodeId).toBe('current-id');
    });

    it('should keep active state after changeType via accessor', () => {
      const { keyboard, treeState, tableModel, accessors, callbacks } =
        createKeyboard(createSchema({ name: stringField }));

      (callbacks.onNodeReplaced as jest.Mock).mockImplementation(
        (oldId: string, newId: string) => {
          keyboard.handleNodeReplaced(oldId, newId);
          treeState.clearNode(oldId);
        },
      );

      const nameNode = tableModel.schema.root.properties()[0];
      expect(nameNode).toBeDefined();
      const oldId = nameNode!.id();
      treeState.setActiveNodeId(oldId);

      const accessor = accessors.get(oldId);
      accessor.actions.changeType('Number');

      expect(treeState.activeNodeId).not.toBeNull();
      expect(treeState.activeNodeId).not.toBe(oldId);
    });

    it('should keep active state after changeType via SchemaEditorCore', () => {
      const core = new SchemaEditorCore(createSchema({ name: stringField }), {
        tableId: 'test',
      });

      const nameNode = core.schemaModel.root.properties()[0];
      expect(nameNode).toBeDefined();
      const oldId = nameNode!.id();
      core.keyboard.handleKeyDown(mockEvent('ArrowDown'));
      core.keyboard.handleKeyDown(mockEvent('ArrowDown'));

      const accessor = core.accessors.get(oldId);
      accessor.actions.changeType('Number');

      expect(core.treeState.activeNodeId).not.toBeNull();
      expect(core.treeState.activeNodeId).not.toBe(oldId);
    });

    it('activeNodeId after changeType should match a node id in the tree', () => {
      const core = new SchemaEditorCore(createSchema({ name: stringField }), {
        tableId: 'test',
      });

      const nameNode = core.schemaModel.root.properties()[0];
      expect(nameNode).toBeDefined();
      const oldId = nameNode!.id();
      core.treeState.setActiveNodeId(oldId);

      const accessor = core.accessors.get(oldId);
      accessor.actions.changeType('Number');

      const activeId = core.treeState.activeNodeId;
      expect(activeId).not.toBeNull();

      const allNodeIds = core.schemaModel.root.properties().map((n) => n.id());
      expect(allNodeIds).toContain(activeId);

      const nodeFromTree = core.schemaModel.nodeById(activeId!);
      expect(nodeFromTree.isNull()).toBe(false);
    });
  });

  describe('dispose', () => {
    it('should clean up without errors', () => {
      const { keyboard } = createKeyboard(createSchema({ name: stringField }));

      expect(() => keyboard.dispose()).not.toThrow();
    });
  });
});
