import { Flex, Text } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { FC } from 'react';
import type { NodeAccessor } from '../../../model/accessor';
import type { SchemaTreeVM } from '../../../model/vm';
import { NodeViewLayout } from '../NodeViewLayout';
import { ArrayItemsView } from './ArrayItemsView';

interface ArrayNodeViewProps {
  accessor: NodeAccessor;
  treeVM: SchemaTreeVM;
  dataTestId: string;
}

export const ArrayNodeView: FC<ArrayNodeViewProps> = observer(
  ({ accessor, treeVM, dataTestId }) => {
    const children = treeVM.getChildAccessors(
      accessor.nodeId,
      accessor.isReadonly,
    );

    return (
      <NodeViewLayout
        accessor={accessor}
        treeVM={treeVM}
        dataTestId={dataTestId}
        collapsible
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
      </NodeViewLayout>
    );
  },
);
