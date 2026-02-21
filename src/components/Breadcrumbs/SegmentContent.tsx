import { Text } from '@chakra-ui/react';
import { Breadcrumb } from '@chakra-ui/react/breadcrumb';
import React from 'react';
import { type BreadcrumbSegment } from './Breadcrumbs';
import {
  BREADCRUMB_BORDER_RADIUS,
  BREADCRUMB_PADDING,
  CURRENT_COLOR,
  HOVER_BG,
  SEGMENT_COLOR,
} from './constants';

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
  if (isHighlighted) {
    return (
      <Breadcrumb.CurrentLink
        color={CURRENT_COLOR}
        fontWeight="600"
        data-testid={segment.dataTestId}
      >
        {segment.label}
      </Breadcrumb.CurrentLink>
    );
  }

  if (onClick) {
    return (
      <Breadcrumb.Link
        as="button"
        color={SEGMENT_COLOR}
        borderRadius={BREADCRUMB_BORDER_RADIUS}
        px={BREADCRUMB_PADDING}
        py={BREADCRUMB_PADDING}
        focusRing="none"
        cursor="pointer"
        _hover={{ bg: HOVER_BG }}
        _focusVisible={{ bg: HOVER_BG }}
        onClick={onClick}
        data-testid={segment.dataTestId}
      >
        {segment.label}
      </Breadcrumb.Link>
    );
  }

  return (
    <Text color={SEGMENT_COLOR} data-testid={segment.dataTestId}>
      {segment.label}
    </Text>
  );
};
