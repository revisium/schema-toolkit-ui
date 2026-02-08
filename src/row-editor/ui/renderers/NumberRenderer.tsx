import { FC, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import type { PrimitiveRendererContext } from './types';
import { Row } from '../components/Row';
import { NumberEditor } from '../editors/NumberEditor';

export const NumberRendererComponent: FC<PrimitiveRendererContext> = observer(
  ({ node }) => {
    const handleSetValue = useCallback(
      (value: number) => {
        node.setValue(value);
      },
      [node],
    );

    return (
      <Row
        node={node}
        name={node.name}
        guides={node.guides}
        formula={node.formula}
        isReadOnly={node.isEditorReadOnly}
        testId={node.testId}
      >
        <NumberEditor
          value={Number(node.value)}
          setValue={handleSetValue}
          readonly={node.isFieldReadOnly}
          dataTestId={`${node.testId}-editor`}
        />
      </Row>
    );
  },
);
