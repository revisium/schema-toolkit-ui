import { Box, Button, Flex } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { FC, useEffect } from 'react';
import { ViewerSwitcherMode, type JsonValue } from '../../types';
import { ViewerSwitcher } from '../../../components/ViewerSwitcher';
import { CloseButton } from '../../../components';
import { BackButton } from '../../../components/BackButton';
import { JsonCard } from '../../../components/JsonCard';
import { SchemaEditorVM, type ForeignKeySelectionCallback } from '../../vm';
import { ObjectNodeView } from '../ObjectNodeView/ObjectNodeView';
import { ChangesPreviewDialog } from '../ChangesPreviewDialog/ChangesPreviewDialog';
import { CreateTableDialog } from '../CreateTableDialog/CreateTableDialog';

interface SchemaEditorProps {
  viewModel: SchemaEditorVM;
  mode: 'creating' | 'updating';
  onApprove: () => Promise<void>;
  onCancel: () => void;
  onSelectForeignKey?: ForeignKeySelectionCallback;
}

export const SchemaEditor: FC<SchemaEditorProps> = observer(
  ({ viewModel, mode, onApprove, onCancel, onSelectForeignKey }) => {
    useEffect(() => {
      viewModel.setOnSelectForeignKey(onSelectForeignKey ?? null);
      return () => {
        viewModel.setOnSelectForeignKey(null);
      };
    }, [viewModel, onSelectForeignKey]);

    const handleApproveClick = () => {
      viewModel.openChangesDialog();
    };

    const handleConfirmApprove = async () => {
      viewModel.setLoading(true);
      await onApprove();
      viewModel.markAsSaved();
      viewModel.setLoading(false);
      viewModel.closeChangesDialog();
    };

    const handleRevert = () => {
      viewModel.revert();
      viewModel.closeChangesDialog();
    };

    const editorHoverStyles = {
      '&:hover .editor-hover-target': { opacity: 1 },
    };

    return (
      <Flex
        flex={1}
        flexDirection="column"
        gap="0.5rem"
        css={editorHoverStyles}
        data-testid="schema-editor-v2"
      >
        <Flex
          justifyContent="space-between"
          width="100%"
          alignItems="center"
          paddingBottom="8px"
        >
          <Box>
            {mode === 'creating' ? (
              <CloseButton
                dataTestId="close-create-table-button"
                onClick={onCancel}
              />
            ) : (
              <BackButton
                dataTestId="back-to-table-list-button"
                onClick={onCancel}
              />
            )}
            {mode === 'creating' ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleApproveClick}
                disabled={viewModel.isApproveDisabled}
                loading={viewModel.loading}
                data-testid="schema-editor-create-button"
              >
                Create Table
              </Button>
            ) : (
              (viewModel.isDirty || viewModel.hasErrors) && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleApproveClick}
                  disabled={viewModel.isApproveDisabled && !viewModel.hasErrors}
                  loading={viewModel.loading}
                  data-testid="schema-editor-approve-button"
                >
                  {viewModel.hasErrors
                    ? 'Review Errors'
                    : `Apply Changes (${viewModel.patchesCount})`}
                </Button>
              )
            )}
          </Box>
          <Box className="editor-hover-target" opacity={0}>
            <ViewerSwitcher
              availableRefByMode={false}
              mode={viewModel.viewMode}
              onChange={viewModel.setViewMode}
            />
          </Box>
        </Flex>
        {viewModel.viewMode === ViewerSwitcherMode.Tree && (
          <Box paddingBottom="4rem">
            <ObjectNodeView
              viewModel={viewModel.rootNodeVM}
              dataTestId="root"
              isRoot
            />
          </Box>
        )}
        {viewModel.viewMode === ViewerSwitcherMode.Json && (
          <JsonCard
            readonly
            data={viewModel.getPlainSchema() as unknown as JsonValue}
          />
        )}

        {mode === 'creating' && (
          <CreateTableDialog
            isOpen={viewModel.isChangesDialogOpen}
            onClose={viewModel.closeChangesDialog}
            onApprove={handleConfirmApprove}
            viewModel={viewModel}
            isLoading={viewModel.loading}
          />
        )}

        {mode === 'updating' && (
          <ChangesPreviewDialog
            isOpen={viewModel.isChangesDialogOpen}
            onClose={viewModel.closeChangesDialog}
            onApprove={handleConfirmApprove}
            onRevert={handleRevert}
            richPatches={viewModel.getRichPatches() as never}
            isLoading={viewModel.loading}
            tableId={viewModel.tableId}
            validationErrors={viewModel.validationErrors as never}
            formulaErrors={viewModel.formulaErrors as never}
          />
        )}
      </Flex>
    );
  },
);
