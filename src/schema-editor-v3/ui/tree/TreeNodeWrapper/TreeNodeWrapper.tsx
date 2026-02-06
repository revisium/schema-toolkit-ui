import { Box, Flex, IconButton } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { FC, ReactNode } from 'react';
import { PiDotOutlineFill } from 'react-icons/pi';
import { MdOutlineChevronRight } from 'react-icons/md';
import type { NodeAccessor } from '../../../model/accessor';

interface TreeNodeWrapperProps {
  accessor: NodeAccessor;
  isCollapsible: boolean;
  isCollapsed: boolean;
  onToggleCollapse?: () => void;
  field: ReactNode;
  hoverTargetClass?: string;
  dataTestId?: string;
  children?: ReactNode;
}

export const TreeNodeWrapper: FC<TreeNodeWrapperProps> = observer(
  ({
    accessor,
    isCollapsible,
    isCollapsed,
    onToggleCollapse,
    field,
    hoverTargetClass,
    dataTestId,
    children,
  }) => {
    const dotOutlineClass = `dot-outline-${accessor.nodeId}`;
    const collapseButtonClass = `collapse-button-${accessor.nodeId}`;

    const isActiveWithName =
      accessor.state.isActive && Boolean(accessor.label.name);

    const collapseHoverStyles =
      isCollapsible && !isCollapsed
        ? {
            [`& .${dotOutlineClass}`]: { visibility: 'hidden' },
            [`& .${collapseButtonClass}`]: { visibility: 'visible' },
          }
        : {};

    const activeCollapseStyles =
      isActiveWithName && isCollapsible && !isCollapsed
        ? {
            [`& .${dotOutlineClass}`]: { visibility: 'hidden' as const },
            [`& .${collapseButtonClass}`]: { visibility: 'visible' as const },
          }
        : {};

    const fieldHoverStyles = hoverTargetClass
      ? {
          [`&:hover .${hoverTargetClass}`]: { opacity: 1 },
          ...(isActiveWithName
            ? { [`& .${hoverTargetClass}`]: { opacity: 1 } }
            : {}),
        }
      : {};

    const getCollapseButtonTestId = (): string | undefined => {
      if (!dataTestId) {
        return undefined;
      }
      return isCollapsed
        ? `${dataTestId}-expand-button`
        : `${dataTestId}-collapse-button`;
    };

    return (
      <Flex
        flexDirection="column"
        alignSelf="flex-start"
        width="100%"
        _hover={collapseHoverStyles}
        css={activeCollapseStyles}
        data-node-id={accessor.nodeId}
        data-active={accessor.state.isActive || undefined}
      >
        <Flex
          gap="4px"
          alignItems="center"
          height="30px"
          mt="2px"
          mb="2px"
          position="relative"
          css={fieldHoverStyles}
          backgroundColor={accessor.state.isActive ? 'gray.100' : undefined}
          borderRadius="4px"
          cursor="default"
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
              data-testid={getCollapseButtonTestId()}
              className={collapseButtonClass}
              visibility={isCollapsed ? 'visible' : 'hidden'}
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
