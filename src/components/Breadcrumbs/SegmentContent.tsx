import { Box } from '@chakra-ui/react';
import React from 'react';
import { type BreadcrumbSegment } from './Breadcrumbs';
import {
  BREADCRUMB_BORDER_RADIUS,
  BREADCRUMB_PADDING,
  CURRENT_COLOR,
  HOVER_BG,
  SEGMENT_COLOR,
} from './constants';

function getCursor(
  onClick: (() => void) | undefined,
  isHighlighted: boolean,
): string {
  if (onClick) return 'pointer';
  if (isHighlighted) return 'text';
  return 'default';
}

interface SegmentContentProps {
  segment: BreadcrumbSegment;
  isHighlighted: boolean;
  onClick?: () => void;
}

export const SegmentContent: React.FC<SegmentContentProps> = ({
  segment,
  isHighlighted,
  onClick,
}) => {
  return (
    <Box
      as={onClick ? 'button' : 'span'}
      display="inline-block"
      color={isHighlighted ? CURRENT_COLOR : SEGMENT_COLOR}
      fontWeight={isHighlighted ? '600' : undefined}
      borderRadius={BREADCRUMB_BORDER_RADIUS}
      px={BREADCRUMB_PADDING}
      py={BREADCRUMB_PADDING}
      cursor={getCursor(onClick, isHighlighted)}
      type={onClick ? 'button' : undefined}
      border="none"
      background="none"
      outline="none"
      lineHeight="inherit"
      fontSize="inherit"
      fontFamily="inherit"
      _hover={onClick ? { bg: HOVER_BG } : undefined}
      _focusVisible={onClick ? { bg: HOVER_BG } : undefined}
      onClick={onClick}
      data-testid={segment.dataTestId}
      aria-current={isHighlighted ? 'page' : undefined}
    >
      {segment.label}
    </Box>
  );
};
