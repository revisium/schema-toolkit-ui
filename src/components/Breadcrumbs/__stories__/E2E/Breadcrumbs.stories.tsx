import { useState } from 'react';
import { Box } from '@chakra-ui/react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor, fn, userEvent } from 'storybook/test';
import {
  Breadcrumbs,
  type BreadcrumbSegment,
  type BreadcrumbsProps,
} from '../../Breadcrumbs';
import { PlusButton } from '../../../PlusButton';

const onSegmentClickSpy = fn().mockName('onSegmentClick');
const onChangeSpy = fn().mockName('editable.onChange');
const onBlurSpy = fn().mockName('editable.onBlur');
const onActionSpy = fn().mockName('onAction');

const SEGMENTS: BreadcrumbSegment[] = [
  { label: 'Database', dataTestId: 'seg-0' },
  { label: 'user', dataTestId: 'seg-1' },
  { label: 'john', dataTestId: 'seg-2' },
];

const StaticWrapper = ({
  highlightLast,
  onSegmentClick,
}: Pick<BreadcrumbsProps, 'highlightLast' | 'onSegmentClick'>) => {
  return (
    <Breadcrumbs
      segments={SEGMENTS}
      highlightLast={highlightLast}
      onSegmentClick={onSegmentClick}
      dataTestId="breadcrumbs"
    />
  );
};

const EditableWrapper = ({
  onSegmentClick,
  onChange,
  onBlur,
  tooltip,
}: {
  onSegmentClick?: BreadcrumbsProps['onSegmentClick'];
  onChange?: (value: string) => void;
  onBlur?: (value: string) => void;
  tooltip?: string;
}) => {
  const [value, setValue] = useState('john');

  return (
    <Breadcrumbs
      segments={[
        { label: 'Database', dataTestId: 'seg-0' },
        { label: 'user', dataTestId: 'seg-1' },
      ]}
      onSegmentClick={onSegmentClick}
      dataTestId="breadcrumbs"
      editable={{
        value,
        onChange: (v) => {
          setValue(v);
          onChange?.(v);
        },
        onBlur,
        tooltip,
        dataTestId: 'editable',
      }}
    />
  );
};

const meta: Meta = {
  title: 'Components/E2E/Breadcrumbs',
  decorators: [
    (Story) => (
      <Box p={4}>
        <Story />
      </Box>
    ),
  ],
};
export default meta;
type Story = StoryObj;

export const StaticSegments: Story = {
  tags: ['test'],
  render: () => (
    <StaticWrapper highlightLast={true} onSegmentClick={onSegmentClickSpy} />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    onSegmentClickSpy.mockClear();

    const seg0 = canvas.getByTestId('seg-0');
    const seg1 = canvas.getByTestId('seg-1');
    const seg2 = canvas.getByTestId('seg-2');

    expect(seg0).toHaveTextContent('Database');
    expect(seg1).toHaveTextContent('user');
    expect(seg2).toHaveTextContent('john');

    const separators = canvas.getAllByText('/');
    expect(separators).toHaveLength(2);

    expect(seg2).toHaveStyle({ fontWeight: '600' });
    expect(seg2).toHaveStyle({ color: 'rgb(0, 0, 0)' });

    await userEvent.click(seg0);
    await waitFor(() => {
      expect(onSegmentClickSpy).toHaveBeenCalledTimes(1);
      expect(onSegmentClickSpy).toHaveBeenCalledWith(
        { label: 'Database', dataTestId: 'seg-0' },
        0,
      );
    });

    onSegmentClickSpy.mockClear();
    await userEvent.click(seg1);
    await waitFor(() => {
      expect(onSegmentClickSpy).toHaveBeenCalledTimes(1);
      expect(onSegmentClickSpy).toHaveBeenCalledWith(
        { label: 'user', dataTestId: 'seg-1' },
        1,
      );
    });

    onSegmentClickSpy.mockClear();
    await userEvent.click(seg2);
    expect(onSegmentClickSpy).not.toHaveBeenCalled();
  },
};

export const HighlightLastOff: Story = {
  tags: ['test'],
  render: () => (
    <StaticWrapper highlightLast={false} onSegmentClick={onSegmentClickSpy} />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    onSegmentClickSpy.mockClear();

    const seg2 = canvas.getByTestId('seg-2');
    expect(seg2).not.toHaveStyle({ fontWeight: '600' });

    await userEvent.click(seg2);
    expect(onSegmentClickSpy).not.toHaveBeenCalled();

    await userEvent.click(canvas.getByTestId('seg-0'));
    await waitFor(() => {
      expect(onSegmentClickSpy).toHaveBeenCalledTimes(1);
      expect(onSegmentClickSpy).toHaveBeenCalledWith(
        { label: 'Database', dataTestId: 'seg-0' },
        0,
      );
    });
  },
};

export const EditableWorkflow: Story = {
  tags: ['test'],
  render: () => (
    <EditableWrapper
      onSegmentClick={onSegmentClickSpy}
      onChange={onChangeSpy}
      onBlur={onBlurSpy}
      tooltip="Rename row"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    onSegmentClickSpy.mockClear();
    onChangeSpy.mockClear();
    onBlurSpy.mockClear();

    const editable = canvas.getByTestId('editable');
    expect(editable).toHaveTextContent('john');

    const separators = canvas.getAllByText('/');
    expect(separators).toHaveLength(2);

    const body = within(document.body);
    const editableParent = editable.parentElement!;
    await userEvent.hover(editableParent);
    await waitFor(() => {
      expect(body.getByText('Rename row')).toBeVisible();
    });
    await userEvent.unhover(editableParent);

    await userEvent.click(canvas.getByTestId('seg-0'));
    await waitFor(() => {
      expect(onSegmentClickSpy).toHaveBeenCalledTimes(1);
    });
    onSegmentClickSpy.mockClear();

    editable.focus();
    await waitFor(() => {
      expect(editable).toHaveFocus();
    });

    await waitFor(() => {
      expect(body.queryByText('Rename row')).not.toBeInTheDocument();
    });

    const selection = window.getSelection()!;
    const range = document.createRange();
    range.selectNodeContents(editable);
    selection.removeAllRanges();
    selection.addRange(range);

    await userEvent.keyboard('{Backspace}');
    for (const char of 'test') {
      await userEvent.keyboard(char);
    }

    await waitFor(() => {
      expect(onChangeSpy).toHaveBeenCalled();
    });

    editable.blur();
    await waitFor(() => {
      expect(onBlurSpy).toHaveBeenCalledTimes(1);
      expect(onBlurSpy).toHaveBeenCalledWith('test');
    });

    await userEvent.hover(editableParent);
    await waitFor(() => {
      expect(body.getByText('Rename row')).toBeVisible();
    });
    await userEvent.unhover(editableParent);

    onChangeSpy.mockClear();
    onBlurSpy.mockClear();

    editable.focus();
    await waitFor(() => {
      expect(editable).toHaveFocus();
    });

    const range2 = document.createRange();
    range2.selectNodeContents(editable);
    selection.removeAllRanges();
    selection.addRange(range2);

    await userEvent.keyboard('{Backspace}');
    for (const char of 'final') {
      await userEvent.keyboard(char);
    }

    await userEvent.keyboard('{Enter}');
    await waitFor(() => {
      expect(onBlurSpy).toHaveBeenCalledTimes(1);
      expect(onBlurSpy).toHaveBeenCalledWith('final');
    });
  },
};

export const ActionButton: Story = {
  tags: ['test'],
  render: () => (
    <Breadcrumbs
      segments={SEGMENTS}
      onSegmentClick={onSegmentClickSpy}
      dataTestId="breadcrumbs"
      action={
        <PlusButton
          tooltip="New row"
          onClick={onActionSpy}
          dataTestId="action-button"
        />
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    onActionSpy.mockClear();
    onSegmentClickSpy.mockClear();

    const actionBtn = canvas.getByTestId('action-button');
    expect(actionBtn).toBeVisible();

    await userEvent.click(actionBtn);
    await waitFor(() => {
      expect(onActionSpy).toHaveBeenCalledTimes(1);
    });

    onActionSpy.mockClear();
    await userEvent.click(canvas.getByTestId('seg-0'));
    await waitFor(() => {
      expect(onSegmentClickSpy).toHaveBeenCalledTimes(1);
    });
    expect(onActionSpy).not.toHaveBeenCalled();
  },
};
