
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
      const focusable = Array.from(
        grid.querySelectorAll<HTMLElement>('a[href]:not([disabled]), button:not([disabled])')
      );
      
      if (focusable.length === 0) return;

      const activeElement = document.activeElement as HTMLElement;
      
      // Only handle navigation if focus is one of the interactive elements within THIS grid
      const currentIndex = focusable.indexOf(activeElement);
      if (currentIndex === -1) {
        return;
      }

      const keyMap: Record<string, string> = {
        ArrowUp: 'up', z: 'up', w: 'up',
        ArrowDown: 'down', s: 'down',
        ArrowLeft: 'left', q: 'left', a: 'left',
        ArrowRight: 'right', d: 'right',
      };

      const direction = keyMap[e.key.toLowerCase()];

      if (!direction) return;

      e.preventDefault();
      e.stopPropagation();
      
      // This is a more reliable way to determine grid layout than checking CSS classes
      const getColumnCount = () => {
        if (focusable.length <= 1) return 1;
        const firstElementTop = focusable[0].offsetTop;
        const firstRowElements = focusable.filter(el => el.offsetTop === firstElementTop);
        // Fallback to 1 if layout is not detected correctly
        return firstRowElements.length > 0 ? firstRowElements.length : 1;
      };

      const columnCount = getColumnCount();
      let nextIndex = currentIndex;

      switch (direction) {
        case 'up':
          nextIndex = currentIndex - columnCount;
          break;
        case 'down':
          nextIndex = currentIndex + columnCount;
          break;
        case 'left':
          // Move left only if not in the first column
          if (currentIndex % columnCount !== 0) {
            nextIndex = currentIndex - 1;
          }
          break;
        case 'right':
          // Move right only if not in the last column of its row
          if ((currentIndex + 1) % columnCount !== 0) {
             nextIndex = currentIndex + 1;
          }
          break;
      }
      
      // If the calculated index is valid, focus the element
      if (nextIndex >= 0 && nextIndex < focusable.length) {
        focusable[nextIndex].focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [gridRef]); // Re-run if gridRef changes
}
