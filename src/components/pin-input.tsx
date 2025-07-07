'use client';
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';

interface PinInputProps {
  onPinComplete: (pin: string) => void;
  onCancel: () => void;
}

export const PinInputPad = ({ onPinComplete, onCancel }: PinInputProps) => {
  const [pin, setPin] = useState('');

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
  
  React.useEffect(() => {
    if (pin.length === 4) {
        const timer = setTimeout(() => handleSubmit(), 200);
        return () => clearTimeout(timer);
    }
  }, [pin, handleSubmit]);

  return (
      <Card className="w-full max-w-sm mx-auto bg-card/80 backdrop-blur-lg">
        <CardHeader>
          <CardTitle>Enter PIN</CardTitle>
          <CardDescription>Enter the 4-digit PIN for this profile.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-4">
             <Input
                type="password"
                value={pin}
                readOnly
                maxLength={4}
                className="w-40 text-center text-3xl tracking-[1em]"
                placeholder="----"
             />
          </div>
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
        </CardContent>
      </Card>
  );
};
