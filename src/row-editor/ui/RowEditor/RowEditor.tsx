import { FC, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { Virtuoso } from 'react-virtuoso';
import type { RowEditorVM } from '../../vm/RowEditorVM';
import type { FlatItem } from '../../vm/flattenNodes';
import { FlatItemView } from './FlatItemView';

export interface RowEditorProps {
  viewModel: RowEditorVM;
}

export const RowEditor: FC<RowEditorProps> = observer(({ viewModel }) => {
  const itemContent = useCallback(
    (_index: number, item: FlatItem) => <FlatItemView item={item} />,
    [],
  );

  return (
    <Virtuoso
      data={viewModel.flattenedNodes as FlatItem[]}
      itemContent={itemContent}
      useWindowScroll
      style={{ width: '100%', height: '100%' }}
    />
  );
});
