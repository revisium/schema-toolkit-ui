import { useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor, screen, userEvent } from 'storybook/test';
import { ViewSettingsBadgeModel } from '../../../Status/model/ViewSettingsBadgeModel.js';
import { ViewSettingsBadge } from '../../../Status/ui/ViewSettingsBadge.js';

const E2EWrapper = observer(
  ({
    canSave = true,
    hasChanges = true,
  }: {
    canSave?: boolean;
    hasChanges?: boolean;
  }) => {
    const [model] = useState(() => {
      const m = new ViewSettingsBadgeModel();
      m.setCanSave(canSave);
      m.setOnSave(() => {
        m.saveSnapshot({ columns: ['id', 'name'] });
        return Promise.resolve();
      });
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

const meta: Meta<typeof E2EWrapper> = {
  component: E2EWrapper as any,
  title: 'TableEditor/E2E/Status/ViewSettingsBadge',
  decorators: [
    (Story) => (
      <Box p={4} maxW="500px">
        <Story />
      </Box>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof E2EWrapper>;

export const ViewSettingsBadgeWorkflow: Story = {
  tags: ['test'],
  render: () => <E2EWrapper canSave={true} hasChanges={true} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      expect((window as any).__testModel).toBeDefined();
    });

    const model = (window as any).__testModel as ViewSettingsBadgeModel;

    const badge = await waitFor(() => {
      const el = canvas.getByTestId('view-settings-badge');
      expect(el).toBeVisible();
      return el;
    });
    await userEvent.click(badge);

    await waitFor(() => {
      expect(screen.getByTestId('view-settings-revert')).toBeVisible();
      expect(screen.getByTestId('view-settings-save')).toBeVisible();
    });

    expect(model.hasChanges).toBe(true);

    await userEvent.click(screen.getByTestId('view-settings-revert'));

    await waitFor(() => {
      expect(model.hasChanges).toBe(false);
    });

    model.saveSnapshot({ columns: ['id'] });
    model.checkForChanges({ columns: ['id', 'name'] });

    const badge2 = await waitFor(() => {
      const el = canvas.getByTestId('view-settings-badge');
      expect(el).toBeVisible();
      return el;
    });
    await userEvent.click(badge2);

    await waitFor(() => {
      expect(screen.getByTestId('view-settings-save')).toBeVisible();
    });

    await userEvent.click(screen.getByTestId('view-settings-save'));

    await waitFor(() => {
      expect(model.hasChanges).toBe(false);
    });
  },
};
