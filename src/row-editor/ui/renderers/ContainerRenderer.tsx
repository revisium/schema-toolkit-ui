import { FC, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import type { ContainerRendererContext } from './types';
import { Row } from '../components/Row';

export const ContainerRendererComponent: FC<ContainerRendererContext> =
  observer(({ node }) => {
    const handleToggle = useCallback(() => {
      node.toggleExpanded();
    }, [node]);

    return (
      <Row
        node={node}
        name={node.name}
        guides={node.guides}
        isCollapsible={node.isCollapsible}
        isExpanded={node.isExpanded}
        onToggle={handleToggle}
        collapsedLabel={node.collapsedLabel}
        isReadOnly={node.isEditorReadOnly}
        testId={node.testId}
      />
    );
  });
