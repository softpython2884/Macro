'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Battery } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SystemStatus() {
  const [time, setTime] = useState('');
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState(false);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };

    updateClock();
    const timerId = setInterval(updateClock, 1000);

    const batteryManager: any = navigator;
    if (batteryManager && typeof batteryManager.getBattery === 'function') {
      batteryManager.getBattery().then((battery: any) => {
        const updateBatteryStatus = () => {
          setBatteryLevel(Math.floor(battery.level * 100));
          setIsCharging(battery.charging);
        }
        updateBatteryStatus();
        battery.addEventListener('levelchange', updateBatteryStatus);
        battery.addEventListener('chargingchange', updateBatteryStatus);

        return () => {
          battery.removeEventListener('levelchange', updateBatteryStatus);
          battery.removeEventListener('chargingchange', updateBatteryStatus);
        };
      });
    }

    return () => clearInterval(timerId);
  }, []);

  return (
    <div className="flex items-center gap-4 text-sm text-muted-foreground">
      {batteryLevel !== null && (
        <div className="flex items-center gap-2">
          <Battery className={cn("h-4 w-4", isCharging && "text-green-500")} />
          <span>{batteryLevel}%</span>
        </div>
      )}
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4" />
        <span>{time}</span>
      </div>
    </div>
  );
}
