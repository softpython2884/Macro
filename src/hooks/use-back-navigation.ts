
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSound } from '@/context/SoundContext';

/**
 * A hook to handle back navigation on Escape or 'B' (gamepad) key press.
 * @param path The path to navigate back to.
 */
export function useBackNavigation(path: string) {
    const router = useRouter();
    const { playSound } = useSound();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            const isAnyDialogOpen = !!document.querySelector('[role="dialog"]');

            if (isAnyDialogOpen) return;

            // Use 'b' for controller 'Back' button, and standard keyboard keys
            if (key === 'escape' || key === 'backspace' || key === 'b') {
                e.preventDefault();
                playSound('back');
                router.push(path);
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [router, path, playSound]);
}
