import { FC, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import type { FileNodeVM } from '../../vm/types';
import { Row } from '../components/Row';
import { FileActions } from '../editors/FileActions';

interface FileRendererContext {
  node: FileNodeVM;
}

export const FileRendererComponent: FC<FileRendererContext> = observer(
  ({ node }) => {
    const handleToggle = useCallback(() => {
      node.toggleExpanded();
    }, [node]);

    return (
      <Row
        node={node}
        name={node.displayName}
        guides={node.guides}
        isCollapsible={node.isCollapsible}
        isExpanded={node.isExpanded}
        onToggle={handleToggle}
        collapsedLabel={node.collapsedLabel}
        isReadOnly={node.isEditorReadOnly}
        testId={node.testId}
        skipMore
      >
        <FileActions node={node} />
      </Row>
    );
  },
);
