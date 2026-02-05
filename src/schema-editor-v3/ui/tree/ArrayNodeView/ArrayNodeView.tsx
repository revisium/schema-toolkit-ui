import { Flex, Text } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { FC } from 'react';
import type { NodeAccessor } from '../../../model/accessor';
import type { SchemaTreeVM } from '../../../model/vm';
import { TreeNodeWrapper } from '../TreeNodeWrapper';
import { TreeNodeField } from '../TreeNodeField';
import { TreeNodeRightContent } from '../TreeNodeRightContent';
import { ArrayItemsView } from './ArrayItemsView';

interface ArrayNodeViewProps {
  accessor: NodeAccessor;
  treeVM: SchemaTreeVM;
  dataTestId: string;
}

export const ArrayNodeView: FC<ArrayNodeViewProps> = observer(
  ({ accessor, treeVM, dataTestId }) => {
    const hoverTargetClass = accessor.hoverTargetClass;
    const isCollapsible = !accessor.isRoot;
    const isCollapsed = !accessor.state.isExpanded;
    const children = treeVM.getChildAccessors(
      accessor.nodeId,
      accessor.isReadonly,
    );

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
          {children.length > 0 && children[0] ? (
            <ArrayItemsView
              accessor={accessor}
              childAccessor={children[0]}
              treeVM={treeVM}
              dataTestId={dataTestId}
            />
          ) : (
            <Text color="gray.400" fontSize="sm" ml="8px">
              items
            </Text>
          )}
        </Flex>
      </TreeNodeWrapper>
    );
  },
);
