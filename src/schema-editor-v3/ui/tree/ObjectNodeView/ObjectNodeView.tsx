import { Box, Flex } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { FC } from 'react';
import { CreateButton } from '../../../../components';
import type { NodeAccessor } from '../../../model/accessor';
import type { SchemaTreeVM } from '../../../model/vm';
import { TreeNodeWrapper } from '../TreeNodeWrapper';
import { TreeNodeField } from '../TreeNodeField';
import { TreeNodeRightContent } from '../TreeNodeRightContent';
import { TreeNodeView } from '../TreeNodeView';

interface ObjectNodeViewProps {
  accessor: NodeAccessor;
  treeVM: SchemaTreeVM;
  dataTestId: string;
}

export const ObjectNodeView: FC<ObjectNodeViewProps> = observer(
  ({ accessor, treeVM, dataTestId }) => {
    const hoverTargetClass = accessor.hoverTargetClass;
    const isCollapsible = !accessor.isRoot;
    const isCollapsed = !accessor.state.isExpanded;
    const children = treeVM.getChildAccessors(
      accessor.nodeId,
      accessor.isReadonly,
    );
    const showAddButton = !accessor.isReadonly;

    const handleChangeType = (typeId: string) => {
      if (accessor.isRoot) {
        treeVM.changeRootType(typeId);
      } else {
        accessor.actions.changeType(typeId);
      }
    };

    return (
      <TreeNodeWrapper
        accessor={accessor}
        isCollapsible={isCollapsible}
        isCollapsed={isCollapsed}
        onToggleCollapse={accessor.state.toggleExpanded}
        hoverTargetClass={hoverTargetClass}
        dataTestId={dataTestId}
        field={
          <TreeNodeField
            accessor={accessor}
            treeVM={treeVM}
            dataTestId={dataTestId}
            hoverTargetClass={hoverTargetClass}
            onChangeType={handleChangeType}
            rightContent={
              <TreeNodeRightContent
                accessor={accessor}
                dataTestId={dataTestId}
                showDelete={!accessor.isRoot}
                onDelete={accessor.actions.remove}
              />
            }
          />
        }
      >
        <Flex flexDirection="column" width="100%">
          {children.map((childAccessor, index) => (
            <TreeNodeView
              key={childAccessor.nodeId}
              accessor={childAccessor}
              treeVM={treeVM}
              dataTestId={`${dataTestId}-${index}`}
            />
          ))}
          {showAddButton && (
            <Box ml="-14px">
              <CreateButton
                dataTestId={`${dataTestId}-create-field-button`}
                title="Field"
                onClick={() => accessor.actions.addProperty('')}
              />
            </Box>
          )}
        </Flex>
      </TreeNodeWrapper>
    );
  },
);
