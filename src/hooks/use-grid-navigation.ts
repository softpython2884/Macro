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
      return Array.from(
        grid.querySelectorAll(
          'a[href]:not([disabled]), button:not([disabled])'
        )
      );
    };
    
    // This is a more robust way to find the column count
    const getColumnCount = (): number => {
        if (!grid) return 1;
        
        // Get the grid's style
        const gridStyle = window.getComputedStyle(grid);
        // Get the grid-template-columns property
        const columnStyle = gridStyle.getPropertyValue('grid-template-columns');
        // Split by space to count the number of columns
        const columnCount = columnStyle.split(' ').length;
        
        return columnCount > 0 ? columnCount : 1;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const focusable = getFocusableElements();
      if (focusable.length === 0) return;

      const activeElement = document.activeElement as HTMLElement;
      const currentIndex = focusable.indexOf(activeElement);

      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        return;
      }
      
      e.preventDefault();
      
      if (currentIndex === -1) {
        focusable[0]?.focus();
        return;
      }

      const columnCount = getColumnCount();
      let nextIndex = currentIndex;

      switch (e.key) {
        case 'ArrowUp':
          if (currentIndex - columnCount >= 0) {
            nextIndex = currentIndex - columnCount;
          }
          break;
        case 'ArrowDown':
          if (currentIndex + columnCount < focusable.length) {
            nextIndex = currentIndex + columnCount;
          } else {
            // Attempt to focus the last item if we are in the last row
            nextIndex = focusable.length - 1;
          }
          break;
        case 'ArrowLeft':
          if (currentIndex % columnCount !== 0 && currentIndex > 0) {
            nextIndex = currentIndex - 1;
          }
          break;
        case 'ArrowRight':
          if ((currentIndex + 1) % columnCount !== 0 && currentIndex + 1 < focusable.length) {
            nextIndex = currentIndex + 1;
          }
          break;
        default:
          return;
      }
      
      if(nextIndex !== currentIndex) {
        focusable[nextIndex]?.focus();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [gridRef]);
}
