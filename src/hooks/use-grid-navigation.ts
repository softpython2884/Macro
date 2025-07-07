
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
      
      const currentIndex = focusable.indexOf(activeElement);
      if (currentIndex === -1) {
        return;
      }
      
      // Handle selection
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        activeElement.click();
        return;
      }

      // Handle navigation
      const isArrowKey = e.key.startsWith('Arrow');
      if (!isArrowKey) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      
      const getColumnCount = () => {
        if (focusable.length <= 1) return 1;
        const firstElementTop = focusable[0].offsetTop;
        const firstRowElements = focusable.filter(el => el.offsetTop === firstElementTop);
        return firstRowElements.length > 0 ? firstRowElements.length : 1;
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
          if (currentIndex % columnCount !== 0) {
            nextIndex = currentIndex - 1;
          }
          break;
        case 'ArrowRight':
          if ((currentIndex + 1) % columnCount !== 0 && currentIndex + 1 < focusable.length) {
             nextIndex = currentIndex + 1;
          }
          break;
      }
      
      if (nextIndex >= 0 && nextIndex < focusable.length) {
        focusable[nextIndex].focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [gridRef]);
}
