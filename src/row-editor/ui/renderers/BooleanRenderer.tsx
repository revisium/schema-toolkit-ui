import { FC, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import type { PrimitiveRendererContext } from './types';
import { Row } from '../components/Row';
import { BooleanEditor } from '../editors/BooleanEditor';

export const BooleanRendererComponent: FC<PrimitiveRendererContext> = observer(
  ({ node }) => {
    const handleSetValue = useCallback(
      (value: boolean) => {
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
        <BooleanEditor
          value={Boolean(node.value)}
          setValue={handleSetValue}
          readonly={node.isFieldReadOnly}
          dataTestId={`${node.testId}-editor`}
        />
      </Row>
    );
  },
);
