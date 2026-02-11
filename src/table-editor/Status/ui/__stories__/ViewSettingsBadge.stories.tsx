import { useEffect, useState } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor, screen, userEvent } from 'storybook/test';
import { RowCountModel } from '../../model/RowCountModel.js';
import { ViewSettingsBadgeModel } from '../../model/ViewSettingsBadgeModel.js';
import { RowCountWidget } from '../RowCountWidget.js';
import { ViewSettingsBadge } from '../ViewSettingsBadge.js';

interface BadgeWrapperProps {
  canSave?: boolean;
  hasChanges?: boolean;
}

const BadgeWrapper = observer(
  ({ canSave = true, hasChanges = true }: BadgeWrapperProps) => {
    const [model] = useState(() => {
      const m = new ViewSettingsBadgeModel();
      m.setCanSave(canSave);
      if (hasChanges) {
        m.saveSnapshot({ columns: ['id'] });
        m.checkForChanges({ columns: ['id', 'name'] });
      }
      return m;
    });

    useEffect(() => {
      (window as any).__testModel = model;
    }, [model]);

    return <ViewSettingsBadge model={model} />;
  },
);

const meta: Meta<typeof BadgeWrapper> = {
  component: BadgeWrapper as any,
  title: 'TableEditor/ViewSettingsBadge',
  decorators: [
    (Story) => (
      <Box p={4} maxW="500px">
        <Story />
      </Box>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof BadgeWrapper>;

export const Unsaved: Story = {
  render: () => <BadgeWrapper canSave={true} hasChanges={true} />,
};

export const Local: Story = {
  render: () => <BadgeWrapper canSave={false} hasChanges={true} />,
};

export const Hidden: Story = {
  render: () => <BadgeWrapper canSave={true} hasChanges={false} />,
};

export const Revert: Story = {
  tags: ['test'],
  render: () => <BadgeWrapper canSave={true} hasChanges={true} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const badge = canvas.getByTestId('view-settings-badge');
    await userEvent.click(badge);

    await waitFor(() => {
      expect(screen.getByTestId('view-settings-revert')).toBeVisible();
    });

    const model = (window as any).__testModel as ViewSettingsBadgeModel;
    expect(model.hasChanges).toBe(true);

    await userEvent.click(screen.getByTestId('view-settings-revert'));

    await waitFor(() => {
      expect(model.hasChanges).toBe(false);
    });
  },
};

export const Save: Story = {
  tags: ['test'],
  render: () => <BadgeWrapper canSave={true} hasChanges={true} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const badge = canvas.getByTestId('view-settings-badge');
    await userEvent.click(badge);

    await waitFor(() => {
      expect(screen.getByTestId('view-settings-save')).toBeVisible();
    });

    const model = (window as any).__testModel as ViewSettingsBadgeModel;
    expect(model.hasChanges).toBe(true);

    await userEvent.click(screen.getByTestId('view-settings-save'));

    await waitFor(() => {
      expect(model.hasChanges).toBe(false);
    });
  },
};

const FooterWrapper = observer(() => {
  const [rowCount] = useState(() => {
    const m = new RowCountModel();
    m.setTotalCount(25);
    m.setBaseTotalCount(100);
    m.setIsFiltering(true);
    return m;
  });

  const [badge] = useState(() => {
    const m = new ViewSettingsBadgeModel();
    m.setCanSave(true);
    m.saveSnapshot({ columns: ['id'] });
    m.checkForChanges({ columns: ['id', 'name'] });
    return m;
  });

  return (
    <Flex
      alignItems="center"
      justifyContent="space-between"
      px={3}
      py={2}
      borderTop="1px solid"
      borderColor="gray.100"
    >
      <RowCountWidget model={rowCount} />
      <ViewSettingsBadge model={badge} />
    </Flex>
  );
});

export const CombinedFooter: Story = {
  render: () => <FooterWrapper />,
};
