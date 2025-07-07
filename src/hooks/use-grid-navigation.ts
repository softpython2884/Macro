'use client';
import { useEffect } from 'react';

interface GridNavigationOptions {
  gridRef: React.RefObject<HTMLElement>;
}

export function useGridNavigation({ gridRef }: GridNavigationOptions) {
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const getFocusableElements = (): HTMLElement[] => {
      if (!grid) return [];
      // This selector ensures we only get interactive elements within the grid
      return Array.from(
        grid.querySelectorAll('a[href]:not([disabled]), button:not([disabled])')
      );
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement as HTMLElement;

      // Crucially, only act if the focused element is within this specific grid.
      // This prevents conflicts if multiple navigable grids are on the same page.
      if (!grid.contains(activeElement)) {
        return;
      }

      const focusable = getFocusableElements();
      if (focusable.length === 0) return;

      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        return;
      }
      
      // Prevent default browser behavior (like scrolling) and stop the event
      // from bubbling up to other listeners.
      e.preventDefault();
      e.stopPropagation();

      const currentIndex = focusable.indexOf(activeElement);
      if (currentIndex === -1) return; // Safeguard

      // Determine column count by checking element positions, which is very reliable.
      const getColumnCount = (): number => {
        if (focusable.length === 0) return 1;
        const firstElementTop = focusable[0].offsetTop;
        let count = 0;
        for (const element of focusable) {
          if (element.offsetTop === firstElementTop) {
            count++;
          } else {
            break;
          }
        }
        return count > 0 ? count : 1;
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
          // Only move left if not in the first column
          if (currentIndex % columnCount !== 0) {
            nextIndex = currentIndex - 1;
          }
          break;
        case 'ArrowRight':
          // Only move right if not in the last column
          if ((currentIndex + 1) % columnCount !== 0) {
            nextIndex = currentIndex + 1;
          }
          break;
      }

      // Check if the calculated nextIndex is valid and exists in the array
      if (nextIndex >= 0 && nextIndex < focusable.length) {
        focusable[nextIndex].focus();
      }
    };
    
    // Listen for keydown events on the document
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup the event listener when the component unmounts
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [gridRef]); // Rerun the effect if the grid ref changes
}
