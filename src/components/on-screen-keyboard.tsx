'use client';
import React, { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useGridNavigation } from '@/hooks/use-grid-navigation';
import { ArrowLeft, CornerDownLeft, X } from 'lucide-react';

interface OnScreenKeyboardProps {
  onInput: (char: string) => void;
  onDelete: () => void;
  onClose: () => void;
  onEnter: () => void;
}

const keyLayout = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['a', 'z', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['q', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm'],
  ['w', 'x', 'c', 'v', 'b', 'n', ',', ';', ':', '!'],
  ['space', 'delete', 'enter', 'close'],
];

export const OnScreenKeyboard = ({ onInput, onDelete, onClose, onEnter }: OnScreenKeyboardProps) => {
  const gridRef = useRef<HTMLDivElement>(null);
  useGridNavigation({ gridRef });

  useEffect(() => {
    // Focus the first key when the keyboard appears
    const firstKey = gridRef.current?.querySelector('button');
    firstKey?.focus();
  }, []);

  const handleKeyPress = (key: string) => {
    switch (key) {
      case 'space':
        onInput(' ');
        break;
      case 'delete':
        onDelete();
        break;
      case 'close':
        onClose();
        break;
      case 'enter':
        onEnter();
        break;
      default:
        onInput(key);
        break;
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 p-4 bg-background/80 backdrop-blur-lg rounded-lg border border-white/10" ref={gridRef}>
      {keyLayout.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-2 justify-center">
          {row.map((key) => {
            let content: React.ReactNode = key.toUpperCase();
            let className = 'w-12 h-12 text-xl';
            if (key === 'space') {
              content = 'Space';
              className = 'w-64 h-12';
            } else if (key === 'delete') {
              content = <ArrowLeft />;
              className = 'w-24 h-12';
            } else if (key === 'close') {
              content = <X />;
              className = 'w-24 h-12';
            } else if (key === 'enter') {
              content = <CornerDownLeft />;
               className = 'w-24 h-12';
            }
            return (
              <Button
                key={key}
                variant="outline"
                className={className}
                onClick={() => handleKeyPress(key)}
              >
                {content}
              </Button>
            );
          })}
        </div>
      ))}
    </div>
  );
};
