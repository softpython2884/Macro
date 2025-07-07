'use client';
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PinInputProps {
  onPinComplete: (pin: string) => void;
  onCancel: () => void;
  showError?: boolean;
}

export const PinInputPad = ({ onPinComplete, onCancel, showError }: PinInputProps) => {
  const [pin, setPin] = useState('');
  const [isWrong, setIsWrong] = useState(false);

  const handleInput = (value: string) => {
    if (pin.length < 4) {
      setPin(pin + value);
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  const handleSubmit = React.useCallback(() => {
    if (pin.length === 4) {
        onPinComplete(pin);
    }
  }, [pin, onPinComplete]);
  
  useEffect(() => {
    if (pin.length === 4) {
        const timer = setTimeout(() => handleSubmit(), 200);
        return () => clearTimeout(timer);
    }
  }, [pin, handleSubmit]);

  useEffect(() => {
    if (showError) {
        setPin('');
        setIsWrong(true);
        const timer = setTimeout(() => setIsWrong(false), 500);
        return () => clearTimeout(timer);
    }
  }, [showError]);

  return (
    <div className="flex flex-col items-center gap-6 pt-4">
      <div className="flex items-center gap-4">
         <Input
            type="password"
            value={pin}
            readOnly
            maxLength={4}
            className={cn(
              "w-40 text-center text-3xl tracking-[1em] transition-all",
              isWrong && "animate-shake border-destructive"
            )}
            placeholder="----"
         />
      </div>
      {showError && <p className="text-destructive text-sm -mt-2">Incorrect PIN. Please try again.</p>}
      <div className="grid grid-cols-3 gap-4">
        {[...Array(9)].map((_, i) => (
          <Button key={i + 1} variant="outline" size="lg" className="text-2xl" onClick={() => handleInput(String(i + 1))}>
            {i + 1}
          </Button>
        ))}
        <Button variant="outline" size="lg" className="text-2xl" onClick={onCancel}>
           Cancel
        </Button>
        <Button variant="outline" size="lg" className="text-2xl" onClick={() => handleInput('0')}>
          0
        </Button>
        <Button variant="destructive" size="lg" onClick={handleDelete}>
          <X className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};
