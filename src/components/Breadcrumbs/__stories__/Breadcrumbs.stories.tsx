import { useState } from 'react';
import { Box } from '@chakra-ui/react';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import {
  Breadcrumbs,
  type BreadcrumbSegment,
  type BreadcrumbsProps,
} from '../Breadcrumbs';
import { PlusButton } from '../../PlusButton';

const SEGMENTS = [{ label: 'Database' }, { label: 'user' }, { label: 'john' }];

const meta: Meta<BreadcrumbsProps> = {
  component: Breadcrumbs,
  title: 'Components/Breadcrumbs',
  decorators: [
    (Story) => (
      <Box p={4}>
        <Story />
      </Box>
    ),
  ],
};
export default meta;
type Story = StoryObj<BreadcrumbsProps>;

export const Default: Story = {
  args: {
    segments: SEGMENTS,
    onSegmentClick: fn().mockName('onSegmentClick'),
  },
};

export const HighlightLastOff: Story = {
  args: {
    segments: SEGMENTS,
    highlightLast: false,
    onSegmentClick: fn().mockName('onSegmentClick'),
  },
};

export const SingleSegment: Story = {
  render: () => (
    <Breadcrumbs
      segments={[{ label: 'Database' }]}
      highlightLast={false}
      action={
        <PlusButton
          tooltip="New table"
          onClick={fn().mockName('onAction')}
          dataTestId="action-button"
        />
      }
    />
  ),
};

const onActionSpy = fn().mockName('onAction');

export const WithAction: Story = {
  render: () => (
    <Breadcrumbs
      segments={[{ label: 'Database' }, { label: 'user' }]}
      highlightLast={false}
      onSegmentClick={fn().mockName('onSegmentClick')}
      action={
        <PlusButton
          tooltip="New row"
          onClick={onActionSpy}
          dataTestId="action-button"
        />
      }
    />
  ),
};

interface EditableWrapperProps {
  onSegmentClick?: (segment: BreadcrumbSegment, index: number) => void;
  onChange?: (value: string) => void;
  onBlur?: (value: string) => void;
}

const EditableWrapper = ({
  onSegmentClick,
  onChange,
  onBlur,
}: EditableWrapperProps) => {
  const [value, setValue] = useState('john');

  return (
    <Breadcrumbs
      segments={[{ label: 'Database' }, { label: 'user' }]}
      onSegmentClick={onSegmentClick}
      editable={{
        value,
        onChange: (v) => {
          setValue(v);
          onChange?.(v);
        },
        onBlur,
      }}
    />
  );
};

export const Editable: Story = {
  render: (args) => (
    <EditableWrapper
      onSegmentClick={args.onSegmentClick}
      onChange={args.editable?.onChange}
      onBlur={args.editable?.onBlur}
    />
  ),
  args: {
    onSegmentClick: fn().mockName('onSegmentClick'),
    editable: {
      value: '',
      onChange: fn().mockName('editable.onChange'),
      onBlur: fn().mockName('editable.onBlur'),
    },
  },
};
