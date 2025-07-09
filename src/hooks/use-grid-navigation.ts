
'use client';
import { useEffect, useCallback } from 'react';
import { useSound } from '@/context/SoundContext';

interface GridNavigationOptions {
  gridRef: React.RefObject<HTMLElement>;
  disabledKeys?: string[];
}

// Function to calculate distance between the centers of two rectangles
function getDistance(rect1: DOMRect, rect2: DOMRect): number {
  const center1 = { x: rect1.left + rect1.width / 2, y: rect1.top + rect1.height / 2 };
  const center2 = { x: rect2.left + rect2.width / 2, y: rect2.top + rect2.height / 2 };
  const dx = center1.x - center2.x;
  const dy = center1.y - center2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

const FOCUSABLE_SELECTOR = [
    'a[href]:not([disabled])',
    'button:not([disabled])',
    'input:not([disabled])',
    'textarea:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[role="button"]',
    '[role="checkbox"]',
    '[role="switch"]',
    '[role="tab"]',
].join(', ');

export function useGridNavigation({ gridRef, disabledKeys = [] }: GridNavigationOptions) {
  const { playSound } = useSound();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const grid = gridRef.current;
    if (!grid) return;

    if (disabledKeys.includes(e.key)) {
        return;
    }

    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' '].includes(e.key)) {
      return;
    }

    const activeElement = document.activeElement as HTMLElement;
    // Important: Only act if focus is inside the controlled grid
    if (!grid.contains(activeElement)) {
      return;
    }

    // Stop default browser action (like scrolling) for these keys
    e.preventDefault();
    e.stopPropagation();

    if (e.key === 'Enter' || e.key === ' ') {
      // Allow custom click handling, but also simulate a click
      if (typeof activeElement.click === 'function') {
        playSound('select');
        activeElement.click();
      }
      return;
    }
    
    const focusable = Array.from(
      grid.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    ).filter(el => el.offsetParent !== null); // Filter for visible elements

    if (focusable.length < 2) return; // Not enough elements to navigate between

    const currentRect = activeElement.getBoundingClientRect();
    let bestCandidate: HTMLElement | null = null;
    let minDistance = Infinity;

    for (const candidate of focusable) {
      if (candidate === activeElement) continue;

      const candidateRect = candidate.getBoundingClientRect();
      const distance = getDistance(currentRect, candidateRect);
      let isViableCandidate = false;

      const dx = (candidateRect.left + candidateRect.width / 2) - (currentRect.left + currentRect.width / 2);
      const dy = (candidateRect.top + candidateRect.height / 2) - (currentRect.top + currentRect.height / 2);
      
      switch (e.key) {
        case 'ArrowUp':
          if (dy < 0 && Math.abs(dy) > Math.abs(dx)) isViableCandidate = true;
          break;
        case 'ArrowDown':
          if (dy > 0 && Math.abs(dy) > Math.abs(dx)) isViableCandidate = true;
          break;
        case 'ArrowLeft':
          if (dx < 0 && Math.abs(dx) > Math.abs(dy)) isViableCandidate = true;
          break;
        case 'ArrowRight':
          if (dx > 0 && Math.abs(dx) > Math.abs(dy)) isViableCandidate = true;
          break;
      }
      
      if (isViableCandidate && distance < minDistance) {
        minDistance = distance;
        bestCandidate = candidate;
      }
    }

    if (bestCandidate) {
      playSound('navigate');
      bestCandidate.focus();
    }
  }, [gridRef, playSound, disabledKeys]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}
