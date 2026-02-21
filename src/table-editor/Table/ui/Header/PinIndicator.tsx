import { Flex } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { LuPin } from 'react-icons/lu';
import type { ColumnsModel } from '../../../Columns/model/ColumnsModel.js';

interface PinIndicatorProps {
  field: string;
  columnsModel: ColumnsModel;
}

export const PinIndicator = observer(
  ({ field, columnsModel }: PinIndicatorProps) => {
    if (!columnsModel.isPinned(field)) {
      return null;
    }

    return (
      <Flex
        alignItems="center"
        color="gray.400"
        flexShrink={0}
        data-testid={`pin-indicator-${field}`}
      >
        <LuPin size={12} />
      </Flex>
    );
  },
);
