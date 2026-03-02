import { Box, Flex, Skeleton } from '@chakra-ui/react';
import { FC } from 'react';
import { Breadcrumbs } from '../../../components/Breadcrumbs/Breadcrumbs.js';
import type { TableEditorBreadcrumb } from '../model/TableEditorCore.js';

const HEADER_ROW_HEIGHT = 40;
const DATA_ROW_HEIGHT = 40;
const SKELETON_ROW_COUNT = 8;

// Fixed column widths (matching typical table column sizes)
const COLUMN_WIDTHS = [120, 150, 120, 100, 130];

// Content skeleton widths per row per column (varying lengths within each fixed column)
const CONTENT_WIDTHS: number[][] = [
  [80, 110, 70, 60, 90],
  [100, 90, 100, 80, 110],
  [60, 130, 80, 70, 80],
  [90, 100, 60, 90, 100],
  [75, 120, 90, 55, 70],
  [110, 80, 75, 80, 120],
  [85, 140, 95, 65, 95],
  [95, 70, 110, 85, 80],
];

interface TableEditorSkeletonProps {
  breadcrumbs: TableEditorBreadcrumb[];
  onBreadcrumbClick?: (segment: { label: string }, index: number) => void;
  showCreateButton?: boolean;
  useWindowScroll?: boolean;
}

export const TableEditorSkeleton: FC<TableEditorSkeletonProps> = ({
  breadcrumbs,
  onBreadcrumbClick,
  showCreateButton,
  useWindowScroll,
}) => (
  <Box
    display="flex"
    flexDirection="column"
    height={useWindowScroll ? undefined : '100%'}
    flex={useWindowScroll ? 1 : undefined}
  >
    <Flex
      px={3}
      pt="32px"
      pb="48px"
      alignItems="flex-start"
      justifyContent="space-between"
      {...(useWindowScroll && {
        position: 'sticky' as const,
        top: 0,
        zIndex: 3,
        bg: 'white',
      })}
    >
      {breadcrumbs.length > 0 ? (
        <Breadcrumbs
          segments={breadcrumbs}
          highlightLast={false}
          onSegmentClick={onBreadcrumbClick}
          action={
            showCreateButton ? (
              <Skeleton height="32px" width="32px" borderRadius="6px" />
            ) : undefined
          }
        />
      ) : (
        <Box />
      )}
      <Flex alignItems="center" gap="8px">
        <Skeleton height="32px" width="32px" borderRadius="6px" />
        <Skeleton height="32px" width="32px" borderRadius="6px" />
        <Skeleton height="32px" width="32px" borderRadius="6px" />
      </Flex>
    </Flex>

    <Box>
      <Flex
        height={`${HEADER_ROW_HEIGHT}px`}
        alignItems="center"
        px={3}
        borderBottom="1px solid"
        borderColor="gray.100"
      >
        {COLUMN_WIDTHS.map((colWidth, j) => (
          <Box key={j} width={`${colWidth}px`} flexShrink={0}>
            <Skeleton height="12px" width="60px" borderRadius="4px" />
          </Box>
        ))}
      </Flex>
      {CONTENT_WIDTHS.slice(0, SKELETON_ROW_COUNT).map((contentWidths, i) => (
        <Flex
          key={i}
          height={`${DATA_ROW_HEIGHT}px`}
          alignItems="center"
          px={3}
          borderBottom="1px solid"
          borderColor="gray.100"
        >
          {COLUMN_WIDTHS.map((colWidth, j) => (
            <Box key={j} width={`${colWidth}px`} flexShrink={0}>
              <Skeleton
                height="14px"
                width={`${contentWidths[j]}px`}
                borderRadius="4px"
              />
            </Box>
          ))}
        </Flex>
      ))}
    </Box>
  </Box>
);
