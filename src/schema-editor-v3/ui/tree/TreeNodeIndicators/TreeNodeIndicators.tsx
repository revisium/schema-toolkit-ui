import { Box, Flex } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { FC } from 'react';
import { PiTextT, PiFunction, PiWarning } from 'react-icons/pi';
import { Tooltip } from '../../../../components';
import type { NodeAccessor } from '../../../model/accessor';

interface TreeNodeIndicatorsProps {
  accessor: NodeAccessor;
}

export const TreeNodeIndicators: FC<TreeNodeIndicatorsProps> = observer(
  ({ accessor }) => {
    const description = accessor.label.description;
    const hasFormula = accessor.formula.hasFormula;
    const formula = accessor.formula.formula;
    const isDeprecated = accessor.label.isDeprecated;

    const hasAnyIndicator = description || hasFormula || isDeprecated;

    if (!hasAnyIndicator) {
      return null;
    }

    return (
      <Flex gap="2px" alignItems="center">
        {isDeprecated && (
          <Tooltip content="Deprecated" positioning={{ placement: 'top' }}>
            <Box
              color="orange.400"
              cursor="default"
              display="flex"
              alignItems="center"
            >
              <PiWarning />
            </Box>
          </Tooltip>
        )}
        {hasFormula && (
          <Tooltip
            content={`Formula: ${formula}`}
            positioning={{ placement: 'top' }}
          >
            <Box
              color="gray.400"
              cursor="default"
              display="flex"
              alignItems="center"
            >
              <PiFunction />
            </Box>
          </Tooltip>
        )}
        {description && (
          <Tooltip content={description} positioning={{ placement: 'top' }}>
            <Box
              color="gray.400"
              cursor="default"
              display="flex"
              alignItems="center"
            >
              <PiTextT />
            </Box>
          </Tooltip>
        )}
      </Flex>
    );
  },
);
