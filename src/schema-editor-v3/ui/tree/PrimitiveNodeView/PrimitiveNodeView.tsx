import { Flex } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { FC } from 'react';
import type { NodeAccessor } from '../../../model/accessor';
import type { SchemaTreeVM } from '../../../model/vm';
import { TreeNodeWrapper } from '../TreeNodeWrapper';
import { TreeNodeField } from '../TreeNodeField';
import { TreeNodeRightContent } from '../TreeNodeRightContent';

interface PrimitiveNodeViewProps {
  accessor: NodeAccessor;
  treeVM: SchemaTreeVM;
  dataTestId: string;
}

export const PrimitiveNodeView: FC<PrimitiveNodeViewProps> = observer(
  ({ accessor, treeVM, dataTestId }) => {
    const hoverTargetClass = accessor.hoverTargetClass;

    const handleChangeType = (typeId: string) => {
      if (accessor.isRoot) {
        treeVM.changeRootType(typeId);
      } else {
        accessor.actions.changeType(typeId);
      }
    };

    return (
      <TreeNodeWrapper
        accessor={accessor}
        isCollapsible={false}
        isCollapsed={false}
        hoverTargetClass={hoverTargetClass}
        field={
          <TreeNodeField
            accessor={accessor}
            treeVM={treeVM}
            dataTestId={dataTestId}
            hoverTargetClass={hoverTargetClass}
            onChangeType={handleChangeType}
            rightContent={
              <TreeNodeRightContent
                accessor={accessor}
                dataTestId={dataTestId}
                showDelete={!accessor.isRoot}
                showFormula={accessor.isPrimitive}
                showDefault={accessor.isPrimitive}
                onDelete={accessor.actions.remove}
              />
            }
          />
        }
      >
        <Flex />
      </TreeNodeWrapper>
    );
  },
);
