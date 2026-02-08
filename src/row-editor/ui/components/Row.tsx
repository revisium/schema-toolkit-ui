import { FC, ReactNode } from 'react';
import { Flex } from '@chakra-ui/react';
import { Guides } from './Guides';
import { Dot } from './Dot';
import { Field } from './Field';
import { More } from './More';
import { NodeMenu } from './NodeMenu';
import type { NodeVM } from '../../vm/types';

export interface RowProps {
  node?: NodeVM;
  name: string;
  guides: boolean[];
  isCollapsible?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
  formula?: string;
  description?: string;
  isDeprecated?: boolean;
  skipDot?: boolean;
  skipField?: boolean;
  skipMore?: boolean;
  collapsedLabel?: string;
  isReadOnly?: boolean;
  testId?: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  children?: ReactNode;
}

export const Row: FC<RowProps> = ({
  node,
  name,
  guides,
  isCollapsible = false,
  isExpanded = true,
  onToggle,
  formula,
  description,
  isDeprecated,
  skipDot,
  skipField,
  skipMore,
  collapsedLabel,
  isReadOnly,
  testId,
  onMouseEnter,
  onMouseLeave,
  children,
}) => {
  const isCollapsed = isCollapsible && !isExpanded;
  const showMenu = node && !isReadOnly;

  return (
    <Flex
      width="100%"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      position="relative"
      className="group"
      data-testid={testId}
    >
      <Guides guides={guides} />
      {showMenu && <NodeMenu node={node} />}
      <Flex width="100%" alignItems="center">
        <Flex>
          {!skipDot && (
            <Dot
              isCollapsed={isCollapsed}
              isCollapsible={isCollapsible}
              toggleCollapsed={onToggle}
              testId={testId}
            />
          )}
          {!skipField && (
            <Field
              name={name}
              formula={formula}
              description={description}
              isDeprecated={isDeprecated}
            />
          )}
          {children}
        </Flex>
        {!skipMore && isCollapsed && collapsedLabel && (
          <More onClick={onToggle} label={collapsedLabel} />
        )}
      </Flex>
    </Flex>
  );
};
