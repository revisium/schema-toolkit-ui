import { Box, Button, Flex } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { FC } from 'react';
import { ViewerSwitcherMode, type JsonValue } from '../../types';
import { ViewerSwitcher } from '../../../components/ViewerSwitcher';
import { CloseButton } from '../../../components';
import { BackButton } from '../../../components/BackButton';
import { JsonCard } from '../../../components/JsonCard';
import { SchemaEditorVM } from '../../vm';
import { NodeView } from '../NodeView/NodeView';
import { ChangesPreviewDialog } from '../ChangesPreviewDialog/ChangesPreviewDialog';

export interface SchemaEditorProps {
  model: SchemaEditorVM;
}

export const SchemaEditor: FC<SchemaEditorProps> = observer(({ model }) => {
  const handleApproveClick = () => {
    model.openChangesDialog();
  };

  const handleRevert = () => {
    model.revert();
    model.closeChangesDialog();
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
          {model.mode === 'creating' ? (
            <CloseButton
              dataTestId="close-create-table-button"
              onClick={model.cancel}
            />
          ) : (
            <BackButton
              dataTestId="back-to-table-list-button"
              onClick={model.cancel}
            />
          )}
          {model.mode === 'creating' ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleApproveClick}
              disabled={model.isApproveDisabled && !model.hasErrors}
              loading={model.loading}
              data-testid="schema-editor-create-button"
            >
              {model.hasErrors ? 'Review Errors' : 'Create Table'}
            </Button>
          ) : (
            (model.isDirty || model.hasErrors) && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleApproveClick}
                disabled={model.isApproveDisabled && !model.hasErrors}
                loading={model.loading}
                data-testid="schema-editor-approve-button"
              >
                {model.hasErrors
                  ? 'Review Errors'
                  : `Apply Changes (${model.totalChangesCount})`}
              </Button>
            )
          )}
        </Box>
        <Box className="editor-hover-target" opacity={0}>
          <ViewerSwitcher
            availableRefByMode={false}
            mode={model.viewMode}
            onChange={model.setViewMode}
          />
        </Box>
      </Flex>
      {model.viewMode === ViewerSwitcherMode.Tree && (
        <Box paddingBottom="4rem">
          <NodeView viewModel={model.rootNodeVM} dataTestId="root" />
        </Box>
      )}
      {model.viewMode === ViewerSwitcherMode.Json && (
        <JsonCard
          readonly
          data={model.getPlainSchema() as unknown as JsonValue}
        />
      )}

      <ChangesPreviewDialog
        isOpen={model.isChangesDialogOpen}
        onClose={model.closeChangesDialog}
        onApprove={model.approve}
        onRevert={handleRevert}
        patches={model.getPatches()}
        isLoading={model.loading}
        tableId={model.tableId}
        tableIdChange={
          model.isTableIdChanged
            ? {
                initialTableId: model.initialTableId,
                currentTableId: model.tableId,
              }
            : undefined
        }
        tableIdError={model.tableIdError}
        validationErrors={model.validationErrors as never}
        formulaErrors={model.formulaErrors as never}
        mode={model.mode}
        createDialogViewMode={model.createDialogViewMode}
        onCreateDialogViewModeChange={model.setCreateDialogViewMode}
        exampleData={model.getExampleData() as JsonValue}
        schemaData={model.getPlainSchema() as unknown as JsonValue}
      />
    </Flex>
  );
});
