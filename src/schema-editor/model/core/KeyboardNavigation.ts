import { makeAutoObservable, reaction, type IReactionDisposer } from 'mobx';
import type { TreeState } from '../state/TreeState';
import type { AccessorCache } from './AccessorCache';
import type { TreeNavigator } from '../utils/TreeNavigator';

export type KeyboardMode = 'TREE_NAV' | 'EDIT_NAME';

interface KeyboardEvent {
  key: string;
  shiftKey: boolean;
  preventDefault: () => void;
}

export class KeyboardNavigation {
  private _mode: KeyboardMode = 'TREE_NAV';
  private _skipNextEscape = false;
  private _suppressNextReturnFocus = false;
  private _containerRef: HTMLElement | null = null;
  private readonly _disposers: IReactionDisposer[] = [];

  constructor(
    private readonly _treeState: TreeState,
    private readonly _navigator: TreeNavigator,
    private readonly _accessors: AccessorCache,
  ) {
    makeAutoObservable(this, {}, { autoBind: true });

    this._disposers.push(
      reaction(
        () => {
          const activeId = this._treeState.activeNodeId;
          if (!activeId) {
            return false;
          }
          return this._treeState.isFocused(activeId);
        },
        (isFocused, wasFocused) => {
          if (isFocused && !wasFocused) {
            this._mode = 'EDIT_NAME';
          }
          if (!isFocused && wasFocused) {
            this._mode = 'TREE_NAV';
            this._skipNextEscape = true;
            if (this._suppressNextReturnFocus) {
              this._suppressNextReturnFocus = false;
            } else {
              this.deferReturnFocus();
            }
          }
        },
      ),
    );
  }

  public get mode(): KeyboardMode {
    return this._mode;
  }

  public get visibleNodeIds(): string[] {
    return this._navigator.visibleNodeIds();
  }

  public handleKeyDown(event: KeyboardEvent): void {
    if (this._mode !== 'TREE_NAV') {
      return;
    }

    if (event.key !== 'Escape') {
      this._skipNextEscape = false;
    }

    if (event.key === 'Tab' && event.shiftKey) {
      event.preventDefault();
      this.moveToPrev();
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
      case 'Tab':
        event.preventDefault();
        this.moveToNext();
        return;
      case 'ArrowUp':
        event.preventDefault();
        this.moveToPrev();
        return;
      case 'ArrowRight':
        event.preventDefault();
        this.expandOrMoveToChild();
        return;
      case 'ArrowLeft':
        event.preventDefault();
        this.collapseOrMoveToParent();
        return;
      case ' ':
        event.preventDefault();
        this.toggleExpand();
        return;
      case 'Enter':
      case 'F2':
      case 'i':
        event.preventDefault();
        this.enterEditMode();
        return;
      case 'Insert':
        event.preventDefault();
        this.insertField();
        return;
      case 'Delete':
      case 'Backspace':
        event.preventDefault();
        this.removeNode();
        return;
      case 'Escape':
        event.preventDefault();
        if (this._skipNextEscape) {
          this._skipNextEscape = false;
          return;
        }
        this.deactivateOrRemoveEmpty();
        return;
    }
  }

  public setContainerRef(el: HTMLElement | null): void {
    if (this._containerRef && !el) {
      document.removeEventListener('mousedown', this.handleNativeMouseDown);
    }
    this._containerRef = el;
    if (this._containerRef) {
      document.addEventListener('mousedown', this.handleNativeMouseDown);
    }
  }

  public returnFocus(): void {
    if (
      this._containerRef &&
      !this._containerRef.contains(document.activeElement)
    ) {
      this._containerRef.focus();
    }
  }

  public deactivate(): void {
    this._treeState.setActiveNodeId(null);
  }

  private readonly handleNativeMouseDown = (event: Event): void => {
    this._skipNextEscape = false;
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    if (this._containerRef?.contains(target)) {
      this._suppressNextReturnFocus = true;
      if (!target.closest('[data-node-id]')) {
        this._treeState.setActiveNodeId(null);
      }
      return;
    }
    const isInsideOverlay = target.closest(
      '[role="menu"], [role="listbox"], [role="dialog"]',
    );
    if (isInsideOverlay) {
      this._suppressNextReturnFocus = true;
    } else {
      this._treeState.setActiveNodeId(null);
    }
  };

  public handleEditEnter(): void {
    this.insertField();
  }

  public handleNodeAdded(nodeId: string): void {
    this._treeState.setActiveNodeId(nodeId);
  }

  public handleNodeReplaced(oldId: string, newId: string): void {
    if (this._treeState.activeNodeId === oldId) {
      this._treeState.setActiveNodeId(newId);
      if (this._mode === 'EDIT_NAME') {
        this._mode = 'TREE_NAV';
      }
      this.deferReturnFocus();
    }
  }

  private deferReturnFocus(): void {
    setTimeout(() => this.returnFocus(), 0);
  }

  public dispose(): void {
    for (const disposer of this._disposers) {
      disposer();
    }
    this._disposers.length = 0;
    this.setContainerRef(null);
  }

  private moveToNext(): void {
    const ids = this.visibleNodeIds;
    if (ids.length === 0) {
      return;
    }

    const activeId = this._treeState.activeNodeId;
    if (!activeId) {
      const firstId = ids[0];
      if (firstId !== undefined) {
        this._treeState.setActiveNodeId(firstId);
        this.scrollToNode(firstId);
      }
      return;
    }

    const currentIndex = ids.indexOf(activeId);
    if (currentIndex === -1 || currentIndex >= ids.length - 1) {
      return;
    }

    const nextId = ids[currentIndex + 1];
    if (nextId !== undefined) {
      this._treeState.setActiveNodeId(nextId);
      this.scrollToNode(nextId);
    }
  }

  private moveToPrev(): void {
    const ids = this.visibleNodeIds;
    if (ids.length === 0) {
      return;
    }

    const activeId = this._treeState.activeNodeId;
    if (!activeId) {
      const lastId = ids.at(-1);
      if (lastId !== undefined) {
        this._treeState.setActiveNodeId(lastId);
        this.scrollToNode(lastId);
      }
      return;
    }

    const currentIndex = ids.indexOf(activeId);
    if (currentIndex <= 0) {
      return;
    }

    const prevId = ids[currentIndex - 1];
    if (prevId !== undefined) {
      this._treeState.setActiveNodeId(prevId);
      this.scrollToNode(prevId);
    }
  }

  private expandOrMoveToChild(): void {
    const activeId = this._treeState.activeNodeId;
    if (!activeId) {
      return;
    }

    const node = this._navigator.getNode(activeId);
    if (node.isNull()) {
      return;
    }

    if (!this._navigator.nodeHasChildren(node)) {
      return;
    }

    const isRoot = this._navigator.isRootId(activeId);

    if (!isRoot && !this._treeState.isExpanded(activeId)) {
      this._treeState.setExpanded(activeId, true);
      return;
    }

    const firstChild = this._navigator.getFirstChildId(node);
    if (firstChild) {
      this._treeState.setActiveNodeId(firstChild);
      this.scrollToNode(firstChild);
    }
  }

  private collapseOrMoveToParent(): void {
    const activeId = this._treeState.activeNodeId;
    if (!activeId) {
      return;
    }

    const node = this._navigator.getNode(activeId);
    if (node.isNull()) {
      return;
    }

    const isRoot = this._navigator.isRootId(activeId);

    if (
      !isRoot &&
      this._navigator.nodeHasChildren(node) &&
      this._treeState.isExpanded(activeId)
    ) {
      this._treeState.setExpanded(activeId, false);
      return;
    }

    const parentId = this._navigator.findParentId(activeId);
    if (parentId) {
      this._treeState.setActiveNodeId(parentId);
      this.scrollToNode(parentId);
    }
  }

  private toggleExpand(): void {
    const activeId = this._treeState.activeNodeId;
    if (!activeId) {
      return;
    }

    const node = this._navigator.getNode(activeId);
    if (node.isNull()) {
      return;
    }

    const isRoot = this._navigator.isRootId(activeId);

    if (!isRoot && this._navigator.nodeHasChildren(node)) {
      this._treeState.toggleExpanded(activeId);
    }
  }

  private insertField(): void {
    const activeId = this._treeState.activeNodeId;
    if (!activeId) {
      return;
    }

    const node = this._navigator.getNode(activeId);
    if (node.isNull()) {
      return;
    }

    if (node.isObject()) {
      const accessor = this._accessors.get(activeId);
      accessor.actions.insertFieldAt(0, '');
      return;
    }

    const parentId = this._navigator.findParentId(activeId);
    if (!parentId) {
      return;
    }

    const parentNode = this._navigator.getNode(parentId);
    if (parentNode.isNull() || !parentNode.isObject()) {
      return;
    }

    const siblings = parentNode.properties();
    const currentIndex = siblings.findIndex((s) => s.id() === activeId);
    if (currentIndex === -1) {
      return;
    }

    const parentAccessor = this._accessors.get(parentId);
    parentAccessor.actions.insertFieldAt(currentIndex + 1, '');
  }

  private enterEditMode(): void {
    const activeId = this._treeState.activeNodeId;
    if (!activeId) {
      return;
    }

    this._treeState.requestFocus(activeId);
  }

  private deactivateOrRemoveEmpty(): void {
    const activeId = this._treeState.activeNodeId;
    if (!activeId) {
      return;
    }

    const node = this._navigator.getNode(activeId);
    const isRoot = this._navigator.isRootId(activeId);

    if (!isRoot && !node.isNull() && !node.name()) {
      this.removeNode();
      return;
    }

    this._treeState.setActiveNodeId(null);
  }

  private removeNode(): void {
    const activeId = this._treeState.activeNodeId;
    if (!activeId) {
      return;
    }

    const accessor = this._accessors.get(activeId);
    if (!accessor.actions.canRemove) {
      return;
    }

    const ids = this.visibleNodeIds;
    const currentIndex = ids.indexOf(activeId);

    accessor.actions.remove();

    const updatedIds = this.visibleNodeIds;
    if (updatedIds.length === 0) {
      this._treeState.setActiveNodeId(null);
      return;
    }

    const nextIndex = Math.min(currentIndex, updatedIds.length - 1);
    const nextId = updatedIds[nextIndex];
    if (nextId !== undefined) {
      this._treeState.setActiveNodeId(nextId);
    }
  }

  private scrollToNode(nodeId: string): void {
    if (!this._containerRef) {
      return;
    }
    const el = this._containerRef.querySelector(`[data-node-id="${nodeId}"]`);
    if (el) {
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }
}
