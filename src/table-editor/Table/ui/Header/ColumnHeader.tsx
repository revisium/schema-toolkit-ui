import { useState } from 'react';
import { Box, Flex, Menu, Portal, Text } from '@chakra-ui/react';
import type { SystemStyleObject } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { ColumnSpec } from '../../../Columns/model/types.js';
import type { ColumnsModel } from '../../../Columns/model/ColumnsModel.js';
import type { FilterModel } from '../../../Filters/model/FilterModel.js';
import type { SortModel } from '../../../Sortings/model/SortModel.js';
import { CELL_BORDER_COLOR, BOTTOM_BORDER_SHADOW } from '../borderConstants.js';
import { ResizeHandle } from '../ResizeHandle.js';
import { SortIndicator } from './SortIndicator.js';
import { PinIndicator } from './PinIndicator.js';
import { FilterIndicator } from './FilterIndicator.js';
import { FormulaIndicator } from './FormulaIndicator.js';
import { ColumnHeaderMenu } from './ColumnHeaderMenu.js';
import { getFieldTypeIcon } from './getFieldTypeIcon.js';

export interface StickyPosition {
  side: 'left' | 'right';
  offsetCss: string;
  isBoundary: boolean;
}

function buildHeaderShadowCss(position: StickyPosition): SystemStyleObject {
  const cssVar =
    position.side === 'left'
      ? 'var(--shadow-left-opacity, 0)'
      : 'var(--shadow-right-opacity, 0)';
  return {
    '&::after': {
      content: '""',
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: '8px',
      pointerEvents: 'none',
      transition: 'opacity 0.15s',
      opacity: cssVar,
      ...(position.side === 'left'
        ? {
            right: '-8px',
            boxShadow: 'inset 8px 0 12px -8px rgba(0,0,0,0.1)',
          }
        : {
            left: '-8px',
            boxShadow: 'inset -8px 0 12px -8px rgba(0,0,0,0.1)',
          }),
    },
  };
}

function getHeaderBoxShadow(stickyPosition?: StickyPosition): string {
  if (!stickyPosition) {
    return BOTTOM_BORDER_SHADOW;
  }
  const stickyBorder =
    stickyPosition.side === 'left'
      ? `inset -1px 0 0 0 ${CELL_BORDER_COLOR}`
      : `inset 1px 0 0 0 ${CELL_BORDER_COLOR}`;
  return `${BOTTOM_BORDER_SHADOW}, ${stickyBorder}`;
}

interface ColumnHeaderProps {
  column: ColumnSpec;
  columnsModel: ColumnsModel;
  sortModel?: SortModel;
  filterModel?: FilterModel;
  onCopyPath?: (path: string) => void;
  stickyPosition?: StickyPosition;
}

export const ColumnHeader = observer(
  ({
    column,
    columnsModel,
    sortModel,
    filterModel,
    onCopyPath,
    stickyPosition,
  }: ColumnHeaderProps) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const w = columnsModel.columnWidthCssVar(column.field);

    const isSticky = Boolean(stickyPosition);

    return (
      <Box
        as="th"
        position={isSticky ? 'sticky' : 'relative'}
        left={
          stickyPosition?.side === 'left' ? stickyPosition.offsetCss : undefined
        }
        right={
          stickyPosition?.side === 'right'
            ? stickyPosition.offsetCss
            : undefined
        }
        zIndex={isSticky ? 2 : undefined}
        width={w}
        minWidth={w}
        maxWidth={w}
        height="inherit"
        bg="white"
        boxShadow={getHeaderBoxShadow(stickyPosition)}
        textAlign="left"
        fontWeight="normal"
        p={0}
        css={
          stickyPosition?.isBoundary
            ? buildHeaderShadowCss(stickyPosition)
            : undefined
        }
      >
        <Menu.Root
          positioning={{ placement: 'bottom-end' }}
          lazyMount
          unmountOnExit
          open={isMenuOpen}
          onOpenChange={(details) => setIsMenuOpen(details.open)}
        >
          <Menu.Trigger asChild>
            <Flex
              alignItems="center"
              height="100%"
              pl="8px"
              pr="16px"
              gap="4px"
              cursor="pointer"
              transition="background 0.15s"
              overflow="hidden"
              _hover={{ bg: 'gray.100' }}
              data-testid={`header-${column.field}`}
            >
              <Flex
                alignItems="center"
                justifyContent="center"
                flexShrink={0}
                fontSize="xs"
                color="gray.400"
                width="16px"
              >
                {getFieldTypeIcon(column.fieldType)}
              </Flex>
              <Text
                fontSize="sm"
                fontWeight="500"
                color="gray.400"
                whiteSpace="nowrap"
                textOverflow="ellipsis"
                overflow="hidden"
                flex={1}
                minWidth={0}
                textDecoration={
                  column.isDeprecated ? 'line-through' : undefined
                }
              >
                {column.label}
              </Text>
              <FormulaIndicator column={column} />
              <PinIndicator field={column.field} columnsModel={columnsModel} />
              {filterModel && column.isSortable && (
                <FilterIndicator
                  field={column.field}
                  filterModel={filterModel}
                />
              )}
              {sortModel && column.isSortable && (
                <SortIndicator field={column.field} sortModel={sortModel} />
              )}
            </Flex>
          </Menu.Trigger>
          <Portal>
            <Menu.Positioner>
              <ColumnHeaderMenu
                column={column}
                columnsModel={columnsModel}
                sortModel={sortModel}
                filterModel={filterModel}
                onCopyPath={onCopyPath}
                onClose={() => setIsMenuOpen(false)}
              />
            </Menu.Positioner>
          </Portal>
        </Menu.Root>
        <ResizeHandle field={column.field} columnsModel={columnsModel} />
      </Box>
    );
  },
);
