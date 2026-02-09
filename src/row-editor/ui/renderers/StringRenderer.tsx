import { FC, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import type { PrimitiveRendererContext } from './types';
import { Row } from '../components/Row';
import { StringEditor } from '../editors/StringEditor';

export const StringRendererComponent: FC<PrimitiveRendererContext> = observer(
  ({ node }) => {
    const value = String(node.value);

    const handleSetValue = useCallback(
      (newValue: string) => {
        node.setValue(newValue);
      },
      [node],
    );

    const handleToggle = useCallback(() => {
      node.toggleExpanded();
    }, [node]);

    if (node.isLongText) {
      return (
        <>
          <Row
            node={node}
            name={node.displayName}
            guides={node.guides}
            formula={node.formula}
            isCollapsible
            isExpanded={node.isExpanded}
            onToggle={handleToggle}
            collapsedLabel={node.collapsedLabel}
            isReadOnly={node.isEditorReadOnly}
            testId={node.testId}
          />
          {node.isExpanded && (
            <Row name="" guides={[...node.guides, true]} skipDot skipField>
              <StringEditor
                value={value}
                setValue={handleSetValue}
                readonly={node.isFieldReadOnly}
                dataTestId={`${node.testId}-editor`}
              />
            </Row>
          )}
        </>
      );
    }

    return (
      <Row
        node={node}
        name={node.displayName}
        guides={node.guides}
        formula={node.formula}
        isReadOnly={node.isEditorReadOnly}
        testId={node.testId}
      >
        <StringEditor
          value={value}
          setValue={handleSetValue}
          readonly={node.isFieldReadOnly}
          dataTestId={`${node.testId}-editor`}
        />
      </Row>
    );
  },
);
