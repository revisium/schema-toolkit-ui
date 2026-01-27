import { Box, Flex, IconButton } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { FC, ReactNode } from 'react';
import { PiDotOutlineFill } from 'react-icons/pi';
import { MdOutlineChevronRight } from 'react-icons/md';
import type { BaseNodeVM } from '../../vm/BaseNodeVM';

interface NodeWrapperProps {
  viewModel: BaseNodeVM;
  isCollapsible: boolean;
  isCollapsed: boolean;
  onToggleCollapse?: () => void;
  field: ReactNode;
  hoverTargetClass?: string;
  children?: ReactNode;
}

export const NodeWrapper: FC<NodeWrapperProps> = observer(
  ({
    viewModel,
    isCollapsible,
    isCollapsed,
    onToggleCollapse,
    field,
    hoverTargetClass,
    children,
  }) => {
    const dotOutlineClass = `dot-outline-${viewModel.nodeId}`;
    const collapseButtonClass = `collapse-button-${viewModel.nodeId}`;

    const collapseHoverStyles =
      isCollapsible && !isCollapsed
        ? {
            [`& .${dotOutlineClass}`]: { visibility: 'hidden' },
            [`& .${collapseButtonClass}`]: { visibility: 'visible' },
          }
        : {};

    const fieldHoverStyles = hoverTargetClass
      ? {
          [`&:hover .${hoverTargetClass}`]: { opacity: 1 },
        }
      : {};

    return (
      <Flex
        flexDirection="column"
        alignSelf="flex-start"
        width="100%"
        _hover={collapseHoverStyles}
      >
        <Flex
          gap="4px"
          alignItems="center"
          height="30px"
          mt="2px"
          mb="2px"
          position="relative"
          css={fieldHoverStyles}
        >
          <Box position="absolute" ml="-60px" height="100%" width="60px" />
          <Box
            className={dotOutlineClass}
            color="gray.300"
            visibility={isCollapsed ? 'hidden' : 'visible'}
          >
            <PiDotOutlineFill />
          </Box>
          {isCollapsible && (
            <IconButton
              className={collapseButtonClass}
              visibility={!isCollapsed ? 'hidden' : 'visible'}
              _hover={{ backgroundColor: 'transparent' }}
              ml="-8px"
              position="absolute"
              size="xs"
              color="gray.400"
              variant="ghost"
              onClick={onToggleCollapse}
              width="26px"
              height="26px"
            >
              <Box rotate={isCollapsed ? '0' : '90deg'}>
                <MdOutlineChevronRight />
              </Box>
            </IconButton>
          )}
          {field}
        </Flex>
        {children && !isCollapsed && (
          <Flex
            ml="7px"
            pl="18px"
            borderLeftWidth={1}
            borderLeftStyle="solid"
            borderLeftColor="white"
            _hover={{ borderLeftColor: 'blackAlpha.200' }}
          >
            {children}
          </Flex>
        )}
      </Flex>
    );
  },
);
