import { observer } from 'mobx-react-lite';
import { FC } from 'react';
import { CloseButton } from '../../../components';
import type { CreatingEditorVM } from '../../model/vm';
import { SchemaEditor } from '../SchemaEditor';
import { CreateTableDialog } from '../dialog';

export interface CreatingSchemaEditorProps {
  vm: CreatingEditorVM;
}

export const CreatingSchemaEditor: FC<CreatingSchemaEditorProps> = observer(
  ({ vm }) => {
    return (
      <SchemaEditor
        vm={vm}
        dataTestId="schema-editor-v3-creating"
        backButton={
          <CloseButton
            dataTestId="close-create-table-button"
            onClick={vm.cancel}
          />
        }
        primaryAction={{
          show: vm.showCreateTableButton,
          label: 'Create Table',
          testId: 'schema-editor-create-button',
          onClick: vm.openCreateDialog,
        }}
        dialogs={
          <CreateTableDialog
            isOpen={vm.isCreateDialogOpen}
            onClose={vm.closeCreateDialog}
            vm={vm.createDialogVM}
          />
        }
      />
    );
  },
);
