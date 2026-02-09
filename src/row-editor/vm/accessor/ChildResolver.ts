import type { RowNodeAccessor } from './RowNodeAccessor';

export interface ChildResolver {
  getChildren(accessor: RowNodeAccessor): readonly RowNodeAccessor[];
}
