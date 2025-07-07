
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * A hook to handle back navigation on Escape or Backspace key press.
 * @param path The path to navigate back to.
 */
export function useBackNavigation(path: string) {
    const router = useRouter();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Use 'B' for controller 'Back' button, and standard keyboard keys
            if (e.key === 'Escape' || e.key === 'Backspace') {
                e.preventDefault();
                router.push(path);
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [router, path]);
}
