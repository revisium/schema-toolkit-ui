import { Flex, Text } from '@chakra-ui/react';
import { Breadcrumb } from '@chakra-ui/react/breadcrumb';
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
    <Flex alignItems="center" gap={BREADCRUMB_PADDING}>
      <Breadcrumb.Root
        fontWeight="400"
        fontSize={BREADCRUMB_FONT_SIZE}
        data-testid={dataTestId}
      >
        <Breadcrumb.List fontSize={BREADCRUMB_FONT_SIZE}>
          {segments.map((segment, index) => {
            const isLast = index === segments.length - 1 && !editable;
            const isHighlighted = isLast && highlightLast;
            const handleClick = onSegmentClick
              ? () => onSegmentClick(segment, index)
              : undefined;

            return (
              <Fragment key={`${segment.label}-${index}`}>
                <Breadcrumb.Item>
                  <SegmentContent
                    segment={segment}
                    isHighlighted={isHighlighted}
                    onClick={isLast ? undefined : handleClick}
                  />
                </Breadcrumb.Item>
                {(!isLast || editable) && (
                  <Breadcrumb.Separator>
                    <Text color={SEPARATOR_COLOR}>{separator}</Text>
                  </Breadcrumb.Separator>
                )}
              </Fragment>
            );
          })}
          {editable && (
            <Breadcrumb.Item>
              <EditableSegment
                value={editable.value}
                onChange={editable.onChange}
                onBlur={editable.onBlur}
                dataTestId={editable.dataTestId}
              />
            </Breadcrumb.Item>
          )}
        </Breadcrumb.List>
      </Breadcrumb.Root>
      {action}
    </Flex>
  );
};
