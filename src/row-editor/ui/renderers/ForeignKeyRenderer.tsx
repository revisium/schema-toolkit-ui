import { FC, useCallback } from 'react';
import { Flex } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { ForeignKeyNodeVM } from '../../vm/types';
import { Row } from '../components/Row';
import { StringEditor } from '../editors/StringEditor';
import { ForeignKeyActions } from '../editors/ForeignKeyActions';
import { ForeignKeyMenu } from '../editors/ForeignKeyMenu';

interface ForeignKeyRendererContext {
  node: ForeignKeyNodeVM;
}

export const ForeignKeyRendererComponent: FC<ForeignKeyRendererContext> =
  observer(({ node }) => {
    const value = String(node.value);

    const handleSetValue = useCallback(
      (newValue: string) => {
        node.setValue(newValue);
      },
      [node],
    );

    const handleSelect = useCallback(
      (id: string) => {
        node.setValue(id);
      },
      [node],
    );

    return (
      <Row
        node={node}
        name={node.displayName}
        guides={node.guides}
        formula={node.formula}
        isReadOnly={node.isEditorReadOnly}
        testId={node.testId}
      >
        <Flex alignItems="center" gap="2px">
          <ForeignKeyMenu
            node={node}
            onSelect={handleSelect}
            disabled={node.isFieldReadOnly}
          >
            <StringEditor
              value={value}
              setValue={handleSetValue}
              readonly={node.isFieldReadOnly}
              dataTestId={`${node.testId}-editor`}
            />
          </ForeignKeyMenu>
          <ForeignKeyActions node={node} />
        </Flex>
      </Row>
    );
  });
