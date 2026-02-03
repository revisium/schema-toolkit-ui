import { Box, Flex } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { FC } from 'react';
import { PiTextT } from 'react-icons/pi';
import { Tooltip } from '../../../components';
import type { BaseNodeVM } from '../../vm/node/BaseNodeVM';

interface NodeIndicatorsProps {
  viewModel: BaseNodeVM;
}

export const NodeIndicators: FC<NodeIndicatorsProps> = observer(
  ({ viewModel }) => {
    if (!viewModel.hasDescription) {
      return null;
    }

    return (
      <Flex gap="2px" alignItems="center" color="gray.400">
        <Tooltip
          content={viewModel.description}
          positioning={{ placement: 'top' }}
        >
          <Box cursor="default">
            <PiTextT />
          </Box>
        </Tooltip>
      </Flex>
    );
  },
);
