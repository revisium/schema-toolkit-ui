import { FC, useEffect, useState } from 'react';
import { Flex, Spinner, Text } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { SearchForeignKeyVM } from '../vm/SearchForeignKeyVM';
import type { SearchForeignKeySearchFn } from '../vm/SearchForeignKeyVM';
import { Header } from './Header';
import { SearchInput } from './SearchInput';
import { List } from './List';
import { Empty } from './Empty';
import { Footer } from './Footer';

interface SearchForeignKeyProps {
  tableId: string;
  onSearch: SearchForeignKeySearchFn;
  onSelect: (id: string) => void;
  onClose?: () => void;
  onOpenTableSearch?: () => void;
  onCreateAndConnect?: () => void;
}

export type { SearchForeignKeyProps };

export const SearchForeignKey: FC<SearchForeignKeyProps> = observer(
  ({
    tableId,
    onSearch,
    onSelect,
    onClose,
    onOpenTableSearch,
    onCreateAndConnect,
  }) => {
    const [model] = useState(() => new SearchForeignKeyVM(tableId, onSearch));

    useEffect(() => {
      model.init();
      return () => model.dispose();
    }, [model]);

    return (
      <Flex
        flexDirection="column"
        height="290px"
        width="100%"
        data-testid="fk-picker"
      >
        <Header tableId={tableId} onClose={onClose} />
        {model.showInput && (
          <SearchInput value={model.search} onChange={model.setSearch} />
        )}
        {model.showLoading && (
          <Flex flex={1} justifyContent="center" alignItems="center">
            <Spinner size="sm" color="gray.400" />
          </Flex>
        )}
        {model.showNotFound && (
          <Flex flex={1} justifyContent="center" alignItems="center">
            <Text fontSize="sm" color="gray.500">
              No results found
            </Text>
          </Flex>
        )}
        {model.showError && (
          <Flex flex={1} justifyContent="center" alignItems="center">
            <Text fontSize="sm" color="gray.500">
              Could not load data
            </Text>
          </Flex>
        )}
        {model.showEmpty && <Empty />}
        {model.showList && <List ids={model.ids} onSelect={onSelect} />}
        {model.showFooter && (
          <Footer
            onOpenTableSearch={onOpenTableSearch}
            onCreateAndConnect={onCreateAndConnect}
          />
        )}
      </Flex>
    );
  },
);
