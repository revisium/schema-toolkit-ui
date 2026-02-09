import { FC, useCallback } from 'react';
import { Flex, IconButton } from '@chakra-ui/react';
import { PiArrowSquareUpRightThin, PiInfo } from 'react-icons/pi';
import { observer } from 'mobx-react-lite';
import { Tooltip } from '../../../components/Tooltip';
import type { ForeignKeyNodeVM } from '../../vm/types';

interface ForeignKeyActionsProps {
  node: ForeignKeyNodeVM;
}

export const ForeignKeyActions: FC<ForeignKeyActionsProps> = observer(
  ({ node }) => {
    const value = String(node.value);
    const showNavigate =
      Boolean(value) && Boolean(node.callbacks?.onNavigateToForeignKey);
    const showWarning = !value && !node.isEditorReadOnly;

    const handleNavigate = useCallback(() => {
      node.callbacks?.onNavigateToForeignKey?.(node.foreignKeyTableId, value);
    }, [node, value]);

    return (
      <Flex alignItems="center" gap="4px">
        {showNavigate && (
          <IconButton
            aria-label="Navigate to foreign key"
            variant="ghost"
            size="2xs"
            color="gray.500"
            _hover={{ color: 'black', bg: 'gray.100' }}
            onClick={handleNavigate}
            data-testid={`${node.testId}-fk-navigate`}
          >
            <PiArrowSquareUpRightThin />
          </IconButton>
        )}
        {showWarning && (
          <Tooltip
            openDelay={50}
            closeDelay={50}
            content="This field requires a valid foreign key ID"
          >
            <Flex
              width="24px"
              height="24px"
              alignItems="center"
              justifyContent="center"
              color="gray.400"
            >
              <PiInfo />
            </Flex>
          </Tooltip>
        )}
      </Flex>
    );
  },
);
