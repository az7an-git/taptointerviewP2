import React from "react";

export function reorderList<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length
  ) {
    return items;
  }

  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

interface UseListReorderOptions {
  onReorder: (fromIndex: number, toIndex: number) => void;
}

export function useListReorder({ onReorder }: UseListReorderOptions) {
  const dragIndexRef = React.useRef<number | null>(null);

  const getDragHandleProps = (index: number, disabled: boolean) => ({
    draggable: !disabled,
    onDragStart: (e: React.DragEvent) => {
      if (disabled) return;
      dragIndexRef.current = index;
      e.dataTransfer.effectAllowed = "move";
    },
    onDragOver: (e: React.DragEvent) => {
      if (disabled) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    },
    onDrop: (e: React.DragEvent) => {
      if (disabled) return;
      e.preventDefault();
      const from = dragIndexRef.current;
      dragIndexRef.current = null;
      if (from === null || from === index) return;
      onReorder(from, index);
    },
    onDragEnd: () => {
      dragIndexRef.current = null;
    },
  });

  return { getDragHandleProps };
}
