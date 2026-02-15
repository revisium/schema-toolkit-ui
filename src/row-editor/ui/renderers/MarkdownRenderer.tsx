import { FC, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import type { PrimitiveRendererContext } from './types';
import { Row } from '../components/Row';
import { MarkdownEditor } from '../editors/MarkdownEditor';

export const MarkdownRendererComponent: FC<PrimitiveRendererContext> = observer(
  ({ node }) => {
    const value = String(node.value);

    const handleSetValue = useCallback(
      (newValue: string) => {
        node.setValue(newValue);
      },
      [node],
    );

    return (
      <>
        <Row
          node={node}
          name={node.displayName}
          guides={node.guides}
          formula={node.formula}
          isCollapsible
          isExpanded={node.isExpanded}
          onToggle={node.toggleExpanded}
          collapsedLabel={node.collapsedLabel}
          isReadOnly={node.isEditorReadOnly}
          testId={node.testId}
        />
        {node.isExpanded && (
          <Row name="" guides={[...node.guides, true]} skipDot skipField>
            <MarkdownEditor
              value={value}
              setValue={handleSetValue}
              readonly={node.isFieldReadOnly}
              dataTestId={`${node.testId}-editor`}
            />
          </Row>
        )}
      </>
    );
  },
);
