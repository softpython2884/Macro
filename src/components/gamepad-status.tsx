'use client';

import React from 'react';
import { Gamepad2, Wifi, WifiOff } from 'lucide-react';
import { useGamepadContext } from '@/context/GamepadContext';

export const GamepadStatus = () => {
  const { isConnected, isEnabled } = useGamepadContext();

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full bg-card/80 backdrop-blur-sm border border-white/10">
      <Gamepad2 className={`w-4 h-4 ${isConnected ? 'text-emerald' : 'text-muted-foreground'}`} />
      {isConnected ? (
        <>
          <Wifi className="w-4 h-4 text-emerald" />
          <span className="text-sm font-medium text-foreground">Connected</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Disconnected</span>
        </>
      )}
      {!isEnabled && (
        <span className="text-xs text-muted-foreground ml-1">(Background)</span>
      )}
    </div>
  );
};
