import { Box, Flex } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { FC } from 'react';
import { PiFunction, PiWarning, PiTextT } from 'react-icons/pi';
import { Tooltip } from '../../../components';
import type { BaseNodeVM } from '../../vm/BaseNodeVM';
import type { PrimitiveNodeVM } from '../../vm/PrimitiveNodeVM';

interface NodeIndicatorsProps {
  viewModel: BaseNodeVM;
}

export const NodeIndicators: FC<NodeIndicatorsProps> = observer(
  ({ viewModel }) => {
    const hasFormula =
      'hasFormula' in viewModel && (viewModel as PrimitiveNodeVM).hasFormula;
    const formula =
      'formula' in viewModel ? (viewModel as PrimitiveNodeVM).formula : '';
    const hasAny =
      hasFormula || viewModel.hasDescription || viewModel.isDeprecated;

    if (!hasAny) {
      return null;
    }

    return (
      <Flex gap="2px" alignItems="center" color="gray.400">
        {hasFormula && (
          <Tooltip
            content={`Formula: ${formula}`}
            positioning={{ placement: 'top' }}
          >
            <Box cursor="default">
              <PiFunction />
            </Box>
          </Tooltip>
        )}
        {viewModel.hasDescription && (
          <Tooltip
            content={viewModel.description}
            positioning={{ placement: 'top' }}
          >
            <Box cursor="default">
              <PiTextT />
            </Box>
          </Tooltip>
        )}
        {viewModel.isDeprecated && (
          <Tooltip content="Deprecated" positioning={{ placement: 'top' }}>
            <Box cursor="default" color="orange.400">
              <PiWarning />
            </Box>
          </Tooltip>
        )}
      </Flex>
    );
  },
);
