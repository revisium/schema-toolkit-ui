import { Box, chakra } from '@chakra-ui/react';
import React from 'react';
import { type BreadcrumbSegment } from './Breadcrumbs';
import {
  BREADCRUMB_BORDER_RADIUS,
  BREADCRUMB_PADDING,
  CURRENT_COLOR,
  HOVER_BG,
  SEGMENT_COLOR,
} from './constants';

const StyledButton = chakra('button');

const SHARED_STYLES = {
  display: 'inline-block',
  borderRadius: BREADCRUMB_BORDER_RADIUS,
  px: BREADCRUMB_PADDING,
  py: BREADCRUMB_PADDING,
  lineHeight: 'inherit',
  fontSize: 'inherit',
  fontFamily: 'inherit',
} as const;

interface SegmentContentProps {
  segment: BreadcrumbSegment;
  isHighlighted: boolean;
  isLast?: boolean;
  onClick?: () => void;
}

export const SegmentContent: React.FC<SegmentContentProps> = ({
  segment,
  isHighlighted,
  isLast,
  onClick,
}) => {
  if (onClick) {
    return (
      <StyledButton
        type="button"
        {...SHARED_STYLES}
        color={isHighlighted ? CURRENT_COLOR : SEGMENT_COLOR}
        fontWeight={isHighlighted ? '600' : undefined}
        cursor="pointer"
        border="none"
        background="none"
        outline="none"
        _hover={{ bg: HOVER_BG }}
        _focusVisible={{ bg: HOVER_BG }}
        onClick={onClick}
        aria-current={isHighlighted ? 'page' : undefined}
        data-testid={segment.dataTestId}
      >
        {segment.label}
      </StyledButton>
    );
  }

  return (
    <Box
      as="span"
      {...SHARED_STYLES}
      color={isHighlighted ? CURRENT_COLOR : SEGMENT_COLOR}
      fontWeight={isHighlighted ? '600' : undefined}
      cursor={isHighlighted || isLast ? 'text' : 'default'}
      aria-current={isHighlighted ? 'page' : undefined}
      data-testid={segment.dataTestId}
    >
      {segment.label}
    </Box>
  );
};
