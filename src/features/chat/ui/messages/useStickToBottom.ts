"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

/** Within this many px of the bottom counts as being at the bottom. */
const AT_BOTTOM_PX = 80;

export interface StickToBottom {
  /** Goes on <ScrollArea viewportRef>. */
  viewportRef: RefObject<HTMLDivElement | null>;
  /** Goes on the element wrapping the rows, inside the ScrollArea. */
  contentRef: RefObject<HTMLDivElement | null>;
  /** Goes on <ScrollArea onScrollPositionChange>. */
  onScrollPositionChange: (position: { x: number; y: number }) => void;
  /** False once the user is reading further up. Drives the jump affordance. */
  following: boolean;
  /** Re-arms following and goes to the bottom. */
  scrollToBottom: (behavior?: ScrollBehavior) => void;
}

/**
 * Follows the bottom of a scroller while the user wants it to. Intent comes from
 * scrollTop moving up, never from the distance to the bottom.
 */
export function useStickToBottom(): StickToBottom {
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const followRef = useRef(true);
  const lastTopRef = useRef(0);
  const [following, setFollowingState] = useState(true);

  const setFollowing = useCallback((next: boolean) => {
    if (followRef.current === next) return;
    followRef.current = next;
    setFollowingState(next);
  }, []);

  const pin = useCallback((behavior: ScrollBehavior = "auto") => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const top = viewport.scrollHeight - viewport.clientHeight;

    lastTopRef.current = top;
    viewport.scrollTo({ top, behavior });
  }, []);

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      setFollowing(true);
      pin(behavior);
    },
    [pin, setFollowing],
  );

  const onScrollPositionChange = useCallback(
    ({ y }: { y: number }) => {
      const viewport = viewportRef.current;
      if (!viewport) return;

      if (viewport.scrollHeight - y - viewport.clientHeight <= AT_BOTTOM_PX) {
        setFollowing(true);
      } else if (y < lastTopRef.current - 1) {
        setFollowing(false);
      }
      lastTopRef.current = y;
    },
    [setFollowing],
  );

  useEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return;

    const observer = new ResizeObserver(() => {
      if (followRef.current) pin();
    });

    observer.observe(content, { box: "border-box" });
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [pin]);

  return { viewportRef, contentRef, onScrollPositionChange, following, scrollToBottom };
}
