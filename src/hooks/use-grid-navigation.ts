
'use client';
import { useEffect } from 'react';

interface GridNavigationOptions {
  gridRef: React.RefObject<HTMLElement>;
}

export function useGridNavigation({ gridRef }: GridNavigationOptions) {
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // We only care about navigation and selection keys
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' '].includes(e.key)) {
        return;
      }

      const focusable = Array.from(
        grid.querySelectorAll<HTMLElement>('a[href]:not([disabled]), button:not([disabled])')
      );
      
      if (focusable.length === 0) return;

      const activeElement = document.activeElement as HTMLElement;
      
      // IMPORTANT: Only handle the event if the focus is currently inside this grid.
      // This prevents multiple grid navigation hooks from conflicting on the same page.
      if (!grid.contains(activeElement)) {
        return;
      }
      
      const currentIndex = focusable.indexOf(activeElement);
      
      // Stop the browser's default behavior for these keys (e.g., scrolling the page)
      e.preventDefault();
      e.stopPropagation();

      // Handle selection (A button on controller)
      if (e.key === 'Enter' || e.key === ' ') {
        activeElement.click();
        return;
      }

      // Handle D-Pad/Arrow navigation
      const getColumnCount = () => {
        // This is a more reliable way to determine the grid's column count.
        // It reads the actual computed CSS `grid-template-columns` property.
        const gridStyles = window.getComputedStyle(grid);
        const columnValue = gridStyles.getPropertyValue('grid-template-columns');
        return columnValue.split(' ').length;
      };

      const columnCount = getColumnCount();
      let nextIndex = currentIndex;

      switch (e.key) {
        case 'ArrowUp':
          nextIndex = currentIndex - columnCount;
          break;
        case 'ArrowDown':
          nextIndex = currentIndex + columnCount;
          break;
        case 'ArrowLeft':
          // Prevent moving left from the first column of any row
          if (currentIndex % columnCount !== 0) {
            nextIndex = currentIndex - 1;
          }
          break;
        case 'ArrowRight':
          // Prevent moving right from the last column of any row, or from the last item
          if ((currentIndex + 1) % columnCount !== 0 && currentIndex + 1 < focusable.length) {
             nextIndex = currentIndex + 1;
          }
          break;
      }
      
      // If the calculated nextIndex is valid, move focus to that element
      if (nextIndex >= 0 && nextIndex < focusable.length) {
        focusable[nextIndex].focus();
      }
    };

    // The event listener needs to be on the document to catch key presses
    // regardless of what specific element has focus.
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [gridRef]);
}
