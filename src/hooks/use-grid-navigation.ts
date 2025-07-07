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
    const getColumnCount = (elements: HTMLElement[]): number => {
        if (elements.length < 2) return 1;
        const firstItemTop = elements[0].getBoundingClientRect().top;
        let count = 0;
        for(const item of elements) {
            if (item.getBoundingClientRect().top === firstItemTop) {
                count++;
            } else {
                break;
            }
        }
        return count > 0 ? count : 1;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const focusable = getFocusableElements();
      if (focusable.length === 0) return;

      const columnCount = getColumnCount(focusable);

      const activeElement = document.activeElement as HTMLElement;
      const currentIndex = focusable.indexOf(activeElement);
      
      // If focus is outside the grid, focus the first element on arrow press
      if (currentIndex === -1) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
          e.preventDefault();
          focusable[0]?.focus();
        }
        return;
      }

      e.preventDefault(); // Prevent default scroll behavior for arrow keys
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
          return; // Do not prevent default for other keys
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
