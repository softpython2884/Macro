'use client';

import { useHints } from '@/context/HintContext';

const KeyDisplay = ({ children }: { children: React.ReactNode }) => (
    <span className="flex items-center justify-center h-6 min-w-6 px-2 rounded-md bg-white/20 text-white font-bold text-xs border border-white/30 mr-2 shadow-md">
        {children}
    </span>
);

export function ControllerHints() {
  const { hints } = useHints();

  if (!hints || hints.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-6 z-50 animate-fade-in">
        <div className="flex items-center gap-4 bg-black/40 backdrop-blur-lg p-2 rounded-lg border border-white/10 shadow-2xl">
            {hints.map((hint, index) => (
                <div key={index} className="flex items-center text-sm text-foreground">
                    <KeyDisplay>{hint.key}</KeyDisplay>
                    <span className="text-muted-foreground">{hint.action}</span>
                </div>
            ))}
        </div>
    </div>
  );
}
