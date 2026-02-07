import { Box, Button, Flex } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { FC, ReactNode } from 'react';
import { ViewerSwitcher } from '../../../components/ViewerSwitcher';
import { ViewerSwitcherMode } from '../../types';
import { JsonCard } from '../../../components/JsonCard';
import type { BaseEditorVM } from '../../model/vm/types';
import { TreeNodeView } from '../tree';
import { ReviewErrorsDialog } from '../dialog';
import type { JsonValue } from '../../types';

export interface SchemaEditorProps {
  vm: BaseEditorVM;
  dataTestId: string;
  backButton: ReactNode;
  primaryAction?: {
    show: boolean;
    label: string;
    testId: string;
    onClick: () => void;
  };
  dialogs: ReactNode;
}

export const SchemaEditor: FC<SchemaEditorProps> = observer(
  ({ vm, dataTestId, backButton, primaryAction, dialogs }) => {
    return (
      <Flex
        flex={1}
        flexDirection="column"
        gap="0.5rem"
        css={{
          '&:hover .editor-hover-target': { opacity: 1 },
        }}
        data-testid={dataTestId}
      >
        <Flex
          justifyContent="space-between"
          width="100%"
          alignItems="center"
          paddingBottom="8px"
        >
          <Box>
            {backButton}
            {vm.showReviewErrorsButton && (
              <Button
                size="sm"
                variant="ghost"
                onClick={vm.openErrorsDialog}
                data-testid="schema-editor-review-errors-button"
              >
                Review Errors ({vm.errorsCount})
              </Button>
            )}
            {primaryAction?.show && (
              <Button
                size="sm"
                variant="ghost"
                onClick={primaryAction.onClick}
                loading={vm.loading}
                data-testid={primaryAction.testId}
              >
                {primaryAction.label}
              </Button>
            )}
          </Box>
          <Box className="editor-hover-target" opacity={0}>
            <ViewerSwitcher
              availableRefByMode={false}
              mode={vm.viewMode as ViewerSwitcherMode}
              onChange={(mode) => vm.setViewMode(mode)}
            />
          </Box>
        </Flex>

        {vm.viewMode === ViewerSwitcherMode.Tree && (
          <Box
            ref={(el: HTMLDivElement | null) =>
              vm.tree.keyboard.setContainerRef(el)
            }
            tabIndex={0}
            onKeyDown={vm.tree.keyboard.handleKeyDown}
            outline={0}
            paddingBottom="4rem"
          >
            <TreeNodeView
              accessor={vm.tree.rootAccessor}
              treeVM={vm.tree}
              dataTestId="root"
            />
          </Box>
        )}

        {vm.viewMode === ViewerSwitcherMode.Json && (
          <JsonCard
            readonly
            data={vm.getPlainSchema() as unknown as JsonValue}
          />
        )}

        <ReviewErrorsDialog
          isOpen={vm.isErrorsDialogOpen}
          onClose={vm.closeErrorsDialog}
          vm={vm.errorsDialogVM}
        />

        {dialogs}
      </Flex>
    );
  },
);
