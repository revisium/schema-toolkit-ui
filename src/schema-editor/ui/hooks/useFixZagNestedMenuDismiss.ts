import { RefObject, useCallback } from 'react';

/**
 * Workaround for zag-js dismissable layer race condition bug.
 *
 * When a submenu closes, focus can briefly move to submenu content element.
 * The parent menu's onFocusOutside handler sees this as "focus outside"
 * and incorrectly closes the parent menu.
 *
 * This hook provides an onInteractOutside handler that prevents the parent
 * menu from closing when the interaction target is a submenu content element.
 *
 * @see https://github.com/chakra-ui/zag/commit/9817e4cb3b18d93408b95e7c827d35801b01a267
 * @see https://github.com/chakra-ui/zag/blob/main/.changeset/fix-nested-layer-dismissal.md
 *
 * This workaround can be removed when @zag-js/dismissable >= 1.34.0 is released
 * and included in @chakra-ui/react (current: 1.31.1). The fix adds recentlyRemoved
 * tracking to layerStack.isInNestedLayer() to ignore focus events during layer cleanup.
 *
 * @param contentRef - Ref to the parent menu content element
 * @returns onInteractOutside handler to pass to Menu.Root
 */
export function useFixZagNestedMenuDismiss(
  contentRef: RefObject<HTMLDivElement | null>,
) {
  return useCallback(
    (e: { preventDefault: () => void }) => {
      const target = (e as unknown as { detail?: { originalEvent?: Event } })
        .detail?.originalEvent?.target;

      if (target instanceof Element) {
        const isSubmenuContent =
          target.closest('[data-scope="menu"][data-part="content"]') &&
          !contentRef.current?.contains(target);

        if (isSubmenuContent) {
          e.preventDefault();
        }
      }
    },
    [contentRef],
  );
}
