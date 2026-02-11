import { observer } from 'mobx-react-lite';
import type { SearchForeignKeySearchFn } from '../../../../search-foreign-key/index.js';
import { FilterFieldType } from '../../../shared/field-types.js';
import type { CellVM } from '../../model/CellVM.js';
import { StringCell } from './StringCell.js';
import { NumberCell } from './NumberCell.js';
import { BooleanCell } from './BooleanCell.js';
import { ForeignKeyCell } from './ForeignKeyCell.js';
import { FileCell } from './FileCell.js';
import { DateTimeCell } from './DateTimeCell.js';
import { ReadonlyCell } from './ReadonlyCell.js';

interface CellRendererProps {
  cell: CellVM;
  onSearchForeignKey?: SearchForeignKeySearchFn;
}

export const CellRenderer = observer(
  ({ cell, onSearchForeignKey }: CellRendererProps) => {
    switch (cell.column.fieldType) {
      case FilterFieldType.String:
        return <StringCell cell={cell} />;
      case FilterFieldType.Number:
        return <NumberCell cell={cell} />;
      case FilterFieldType.Boolean:
        return <BooleanCell cell={cell} />;
      case FilterFieldType.ForeignKey:
        return (
          <ForeignKeyCell cell={cell} onSearchForeignKey={onSearchForeignKey} />
        );
      case FilterFieldType.File:
        return <FileCell cell={cell} />;
      case FilterFieldType.DateTime:
        return <DateTimeCell cell={cell} />;
      default:
        return <ReadonlyCell cell={cell} />;
    }
  },
);
