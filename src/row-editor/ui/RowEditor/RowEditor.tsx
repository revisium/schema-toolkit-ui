import { FC, useCallback, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { reaction } from 'mobx';
import { Virtuoso } from 'react-virtuoso';
import type { JsonValuePatch } from '@revisium/schema-toolkit';
import type { RowEditorVM } from '../../vm/RowEditorVM';
import type { FlatItem } from '../../vm/flattenNodes';
import { FlatItemView } from './FlatItemView';

export interface RowEditorProps {
  viewModel: RowEditorVM;
  onChange?: (patches: readonly JsonValuePatch[]) => void;
}

export const RowEditor: FC<RowEditorProps> = observer(
  ({ viewModel, onChange }) => {
    const itemContent = useCallback(
      (_index: number, item: FlatItem) => <FlatItemView item={item} />,
      [],
    );

    useEffect(() => {
      if (!onChange) {
        return;
      }
      return reaction(
        () => viewModel.patches,
        () => {
          if (viewModel.isDirty && viewModel.isValid) {
            const newPatches = viewModel.consumePatches();
            if (newPatches.length > 0) {
              onChange(newPatches);
            }
          }
        },
      );
    }, [viewModel, onChange]);

    return (
      <Virtuoso
        data={viewModel.flattenedNodes as FlatItem[]}
        itemContent={itemContent}
        useWindowScroll
        style={{ width: '100%', height: '100%' }}
      />
    );
  },
);
