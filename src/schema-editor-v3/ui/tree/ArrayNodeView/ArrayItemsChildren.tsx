import { Box, Flex } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { FC } from 'react';
import { CreateButton } from '../../../../components';
import type { NodeAccessor } from '../../../model/accessor';
import type { SchemaTreeVM } from '../../../model/vm';
import { TreeNodeView } from '../TreeNodeView';
import { ArrayItemsView } from './ArrayItemsView';
import { ForeignKeyValue } from './ForeignKeyValue';

interface ArrayItemsChildrenProps {
  accessor: NodeAccessor;
  treeVM: SchemaTreeVM;
  dataTestId: string;
}

export const ArrayItemsChildren: FC<ArrayItemsChildrenProps> = observer(
  ({ accessor, treeVM, dataTestId }) => {
    if (accessor.isObject) {
      const children = treeVM.getChildAccessors(
        accessor.nodeId,
        accessor.isReadonly,
      );
      return (
        <Flex flexDirection="column" width="100%">
          {children.map((childAccessor, index) => (
            <TreeNodeView
              key={childAccessor.nodeId}
              accessor={childAccessor}
              treeVM={treeVM}
              dataTestId={`${dataTestId}-${index}`}
            />
          ))}
          {accessor.actions.canAddProperty && (
            <Box ml="-14px">
              <CreateButton
                dataTestId={`${dataTestId}-create-field-button`}
                title="Field"
                onClick={() => accessor.actions.addProperty('')}
              />
            </Box>
          )}
        </Flex>
      );
    }

    if (accessor.isArray) {
      const children = treeVM.getChildAccessors(
        accessor.nodeId,
        accessor.isReadonly,
      );
      if (children.length > 0 && children[0]) {
        return (
          <ArrayItemsView
            accessor={accessor}
            childAccessor={children[0]}
            treeVM={treeVM}
            dataTestId={dataTestId}
          />
        );
      }
    }

    if (accessor.isForeignKey) {
      return <ForeignKeyValue accessor={accessor} dataTestId={dataTestId} />;
    }

    return null;
  },
);
