import { Box, Flex } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { FC } from 'react';
import { CreateButton } from '../../../../components';
import type { NodeAccessor } from '../../../model/accessor';
import type { SchemaTreeVM } from '../../../model/vm';
import { NodeViewLayout } from '../NodeViewLayout';
import { TreeNodeView } from '../TreeNodeView';

interface ObjectNodeViewProps {
  accessor: NodeAccessor;
  treeVM: SchemaTreeVM;
  dataTestId: string;
}

export const ObjectNodeView: FC<ObjectNodeViewProps> = observer(
  ({ accessor, treeVM, dataTestId }) => {
    const hideContent = accessor.isRoot && !accessor.label.name;
    const children = treeVM.getChildAccessors(
      accessor.nodeId,
      accessor.isReadonly,
    );
    const showAddButton = !accessor.isReadonly && !hideContent;

    return (
      <NodeViewLayout
        accessor={accessor}
        treeVM={treeVM}
        dataTestId={dataTestId}
        collapsible
      >
        {!hideContent && (
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
        )}
      </NodeViewLayout>
    );
  },
);
