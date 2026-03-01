import { Flex, Text } from '@chakra-ui/react';
import React, { Fragment } from 'react';
import {
  BREADCRUMB_FONT_SIZE,
  BREADCRUMB_PADDING,
  SEPARATOR_COLOR,
} from './constants';
import { EditableSegment } from './EditableSegment';
import { SegmentContent } from './SegmentContent';

export interface BreadcrumbSegment {
  label: string;
  dataTestId?: string;
}

export interface BreadcrumbEditableProps {
  value: string;
  onChange?: (value: string) => void;
  onBlur?: (value: string) => void;
  tooltip?: string;
  placeholder?: string;
  dataTestId?: string;
}

export interface BreadcrumbsProps {
  segments: BreadcrumbSegment[];
  separator?: string;
  dataTestId?: string;
  highlightLast?: boolean;
  onSegmentClick?: (segment: BreadcrumbSegment, index: number) => void;
  editable?: BreadcrumbEditableProps;
  action?: React.ReactNode;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  segments,
  separator = '/',
  dataTestId,
  highlightLast = true,
  onSegmentClick,
  editable,
  action,
}) => {
  return (
    <Flex
      as="nav"
      aria-label="breadcrumb"
      alignItems="center"
      gap={BREADCRUMB_PADDING}
      data-testid={dataTestId}
    >
      <Flex
        as="ol"
        alignItems="center"
        listStyleType="none"
        margin={0}
        padding={0}
        fontWeight="400"
        fontSize={BREADCRUMB_FONT_SIZE}
        gap={BREADCRUMB_PADDING}
      >
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1 && !editable;
          const isHighlighted = isLast && highlightLast;
          const handleClick = onSegmentClick
            ? () => onSegmentClick(segment, index)
            : undefined;

          return (
            <Fragment key={`${segment.label}-${index}`}>
              <Flex as="li" alignItems="center">
                <SegmentContent
                  segment={segment}
                  isHighlighted={isHighlighted}
                  onClick={isLast ? undefined : handleClick}
                />
              </Flex>
              {(!isLast || editable) && (
                <Flex as="li" aria-hidden alignItems="center">
                  <Text
                    color={SEPARATOR_COLOR}
                    px={BREADCRUMB_PADDING}
                    lineHeight={1}
                  >
                    {separator}
                  </Text>
                </Flex>
              )}
            </Fragment>
          );
        })}
        {editable && (
          <Flex as="li" alignItems="center">
            <EditableSegment
              value={editable.value}
              onChange={editable.onChange}
              onBlur={editable.onBlur}
              tooltip={editable.tooltip}
              placeholder={editable.placeholder}
              dataTestId={editable.dataTestId}
            />
          </Flex>
        )}
      </Flex>
      {action}
    </Flex>
  );
};
