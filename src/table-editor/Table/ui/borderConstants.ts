import type { SystemStyleObject } from '@chakra-ui/react';

export const CELL_BORDER_COLOR = '#ededed';
export const BOTTOM_BORDER_SHADOW = `inset 0 -1px 0 0 ${CELL_BORDER_COLOR}`;

export function buildAddColumnShadowCss(): SystemStyleObject {
  return {
    '&::after': {
      content: '""',
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: '8px',
      left: '-8px',
      pointerEvents: 'none',
      transition: 'opacity 0.15s',
      opacity: 'var(--shadow-right-opacity, 0)',
      boxShadow: 'inset -8px 0 12px -8px rgba(0,0,0,0.1)',
    },
  };
}

export function adjustRightOffsetCss(
  rightCss: string,
  addColOffset: number,
): string {
  if (addColOffset <= 0) {
    return rightCss;
  }
  if (rightCss === '0px') {
    return `${addColOffset}px`;
  }
  return `calc(${rightCss} + ${addColOffset}px)`;
}
