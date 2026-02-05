import { observer } from 'mobx-react-lite';
import { FC } from 'react';
import { BackButton } from '../../../components/BackButton';
import type { UpdatingEditorVM } from '../../model/vm';
import { SchemaEditor } from '../SchemaEditor';
import { ReviewChangesDialog } from '../dialog';

export interface UpdatingSchemaEditorProps {
  vm: UpdatingEditorVM;
}

export const UpdatingSchemaEditor: FC<UpdatingSchemaEditorProps> = observer(
  ({ vm }) => {
    return (
      <SchemaEditor
        vm={vm}
        dataTestId="schema-editor-v3-updating"
        backButton={
          <BackButton
            dataTestId="back-to-table-list-button"
            onClick={vm.cancel}
          />
        }
        primaryAction={{
          show: vm.showApplyChangesButton,
          label: `Apply Changes (${vm.totalChangesCount})`,
          testId: 'schema-editor-approve-button',
          onClick: vm.openChangesDialog,
        }}
        dialogs={
          <ReviewChangesDialog
            isOpen={vm.isChangesDialogOpen}
            onClose={vm.closeChangesDialog}
            vm={vm.changesDialogVM}
          />
        }
      />
    );
  },
);
