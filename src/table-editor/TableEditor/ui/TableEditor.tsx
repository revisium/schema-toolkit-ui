import { FC } from 'react';
import { Box, Flex, Spinner } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { Breadcrumbs } from '../../../components/Breadcrumbs/Breadcrumbs.js';
import { PlusButton } from '../../../components/PlusButton/index.js';
import { FilterWidget } from '../../Filters/ui/FilterWidget.js';
import { SearchWidget } from '../../Search/ui/SearchWidget.js';
import { SortingsWidget } from '../../Sortings/ui/SortingsWidget.js';
import { RowCountWidget } from '../../Status/ui/RowCountWidget.js';
import { ViewSettingsBadge } from '../../Status/ui/ViewSettingsBadge.js';
import { TableWidget } from '../../Table/ui/TableWidget.js';
import type { TableEditorCore } from '../model/TableEditorCore.js';

const noop = () => {};

export interface TableEditorProps {
  viewModel: TableEditorCore;
  useWindowScroll?: boolean;
}

export const TableEditor: FC<TableEditorProps> = observer(
  ({ viewModel, useWindowScroll }) => {
    if (viewModel.isBootstrapping) {
      return (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          height="100%"
        >
          <Spinner />
        </Box>
      );
    }

    const isReadonly = viewModel.readonly;
    const { breadcrumbs, callbacks } = viewModel;

    return (
      <Box display="flex" flexDirection="column" height="100%">
        <Flex
          px={3}
          pt={2}
          mb="48px"
          alignItems="center"
          justifyContent="space-between"
        >
          {breadcrumbs.length > 0 && (
            <Breadcrumbs
              segments={breadcrumbs}
              highlightLast={false}
              onSegmentClick={callbacks.onBreadcrumbClick}
              action={
                !isReadonly && callbacks.onCreateRow ? (
                  <PlusButton
                    tooltip="New row"
                    onClick={callbacks.onCreateRow}
                    dataTestId="create-row-button"
                  />
                ) : undefined
              }
            />
          )}
          <Flex alignItems="center" gap="8px">
            <SearchWidget model={viewModel.search} />
            <FilterWidget
              model={viewModel.filters}
              availableFields={viewModel.columns.filterableFields}
            />
            <SortingsWidget
              model={viewModel.sorts}
              availableFields={viewModel.columns.sortableFields}
              onChange={noop}
            />
          </Flex>
        </Flex>

        <Box flex={1} minHeight={0}>
          <TableWidget
            rows={viewModel.rows}
            columnsModel={viewModel.columns}
            cellFSM={viewModel.cellFSM}
            selection={viewModel.selection}
            sortModel={viewModel.sorts}
            filterModel={viewModel.filters}
            isLoadingMore={viewModel.isLoadingMore}
            onEndReached={viewModel.loadMore}
            onOpenRow={callbacks.onOpenRow}
            onDeleteRow={
              isReadonly ? undefined : (id) => viewModel.deleteRows([id])
            }
            onDuplicateRow={isReadonly ? undefined : callbacks.onDuplicateRow}
            onDeleteSelected={
              isReadonly ? undefined : (ids) => viewModel.deleteRows(ids)
            }
            onSearchForeignKey={callbacks.onSearchForeignKey}
            onUploadFile={callbacks.onUploadFile}
            onOpenFile={callbacks.onOpenFile}
            onCopyPath={callbacks.onCopyPath}
            useWindowScroll={useWindowScroll}
          />
        </Box>

        <Flex px={3} py={2} justifyContent="space-between">
          <RowCountWidget model={viewModel.rowCount} />
          <ViewSettingsBadge model={viewModel.viewBadge} />
        </Flex>
      </Box>
    );
  },
);
