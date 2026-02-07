import { Box, Text } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { FC } from 'react';
import type { NodeAccessor } from '../../../model/accessor';
import type { SchemaTreeVM } from '../../../model/vm';
import { ObjectNodeView } from '../ObjectNodeView';
import { ArrayNodeView } from '../ArrayNodeView';
import { PrimitiveNodeView } from '../PrimitiveNodeView';
import { ForeignKeyNodeView } from '../ForeignKeyNodeView';
import { RefNodeView } from '../RefNodeView';

interface TreeNodeViewProps {
  accessor: NodeAccessor;
  treeVM: SchemaTreeVM;
  dataTestId: string;
  showItemsLabel?: boolean;
}

export const TreeNodeView: FC<TreeNodeViewProps> = observer(
  ({ accessor, treeVM, dataTestId, showItemsLabel }) => {
    const renderNode = () => {
      if (accessor.isObject) {
        return (
          <ObjectNodeView
            accessor={accessor}
            treeVM={treeVM}
            dataTestId={dataTestId}
          />
        );
      }

      if (accessor.isArray) {
        return (
          <ArrayNodeView
            accessor={accessor}
            treeVM={treeVM}
            dataTestId={dataTestId}
          />
        );
      }

      if (accessor.isForeignKey) {
        return (
          <ForeignKeyNodeView
            accessor={accessor}
            treeVM={treeVM}
            dataTestId={dataTestId}
          />
        );
      }

      if (accessor.isRef) {
        return (
          <RefNodeView
            accessor={accessor}
            treeVM={treeVM}
            dataTestId={dataTestId}
          />
        );
      }

      if (accessor.isPrimitive) {
        return (
          <PrimitiveNodeView
            accessor={accessor}
            treeVM={treeVM}
            dataTestId={dataTestId}
          />
        );
      }

      return null;
    };

    if (showItemsLabel) {
      return (
        <Box>
          <Text color="gray.400" fontSize="sm" ml="-6px" mb="-4px">
            items
          </Text>
          {renderNode()}
        </Box>
      );
    }

    return renderNode();
  },
);
