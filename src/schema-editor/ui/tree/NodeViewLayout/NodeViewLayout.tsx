import { observer } from 'mobx-react-lite';
import { FC, ReactNode } from 'react';
import type { NodeAccessor } from '../../../model/accessor';
import type { SchemaTreeVM } from '../../../model/vm';
import { TreeNodeWrapper } from '../TreeNodeWrapper';
import { TreeNodeField } from '../TreeNodeField';
import { TreeNodeRightContent } from '../TreeNodeRightContent';

interface NodeViewLayoutProps {
  accessor: NodeAccessor;
  treeVM: SchemaTreeVM;
  dataTestId: string;
  collapsible?: boolean;
  showFormula?: boolean;
  showDefault?: boolean;
  children?: ReactNode;
}

export const NodeViewLayout: FC<NodeViewLayoutProps> = observer(
  ({
    accessor,
    treeVM,
    dataTestId,
    collapsible = false,
    showFormula,
    showDefault,
    children,
  }) => {
    const hoverTargetClass = accessor.hoverTargetClass;
    const isCollapsible = collapsible && !accessor.isRoot;
    const isCollapsed = isCollapsible && !accessor.state.isExpanded;

    return (
      <TreeNodeWrapper
        accessor={accessor}
        isCollapsible={isCollapsible}
        isCollapsed={isCollapsed}
        onToggleCollapse={
          isCollapsible ? accessor.state.toggleExpanded : undefined
        }
        hoverTargetClass={hoverTargetClass}
        dataTestId={dataTestId}
        field={
          <TreeNodeField
            accessor={accessor}
            treeVM={treeVM}
            dataTestId={dataTestId}
            hoverTargetClass={hoverTargetClass}
            onChangeType={(typeId) => treeVM.changeNodeType(accessor, typeId)}
            rightContent={
              <TreeNodeRightContent
                accessor={accessor}
                dataTestId={dataTestId}
                showDelete={!accessor.isRoot}
                showFormula={showFormula}
                showDefault={showDefault}
                onDelete={accessor.actions.remove}
              />
            }
          />
        }
      >
        {children}
      </TreeNodeWrapper>
    );
  },
);
