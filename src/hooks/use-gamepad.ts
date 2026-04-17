'use client';

import { useEffect, useRef, useCallback } from 'react';

type GamepadButton = {
  pressed: boolean;
  touched: boolean;
  value: number;
};

type GamepadState = {
  buttons: GamepadButton[];
  axes: number[];
};

type GamepadMapping = {
  [buttonIndex: string]: string; // Maps button index to keyboard key
};

const DEFAULT_MAPPING: GamepadMapping = {
  0: 'a',      // A button
  1: 'b',      // B button
  2: 'x',      // X button
  3: 'y',      // Y button
  4: 'l',      // Left bumper
  5: 'r',      // Right bumper
  6: 'l2',     // Left trigger
  7: 'r2',     // Right trigger
  8: 'select', // Select/Back button
  9: 'start',  // Start button
  10: 'l3',    // Left stick click
  11: 'r3',    // Right stick click
  12: 'up',    // D-pad up
  13: 'down',  // D-pad down
  14: 'left',  // D-pad left
  15: 'right', // D-pad right
  16: 'home',  // Home/Guide button
};

const AXIS_THRESHOLD = 0.5;

export const useGamepad = (mapping: GamepadMapping = DEFAULT_MAPPING) => {
  const gamepadIndexRef = useRef<number | null>(null);
  const previousStateRef = useRef<GamepadState | null>(null);
  const isEnabledRef = useRef(true);

  // Handle visibility change to enable/disable gamepad when tab is background
  useEffect(() => {
    const handleVisibilityChange = () => {
      isEnabledRef.current = document.visibilityState === 'visible';
      console.log(`Gamepad ${isEnabledRef.current ? 'enabled' : 'disabled'} (tab ${document.visibilityState})`);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const simulateKeyPress = useCallback((key: string, isPressed: boolean) => {
    if (!isEnabledRef.current) return;

    const event = new KeyboardEvent(isPressed ? 'keydown' : 'keyup', {
      key: key.toLowerCase(),
      code: key.toLowerCase(),
      bubbles: true,
    });
    document.dispatchEvent(event);
  }, []);

  const handleAxisMovement = useCallback((axes: number[]) => {
    if (!isEnabledRef.current) return;

    const [leftX, leftY, rightX, rightY] = axes;

    // D-pad simulation with left stick
    if (Math.abs(leftX) > AXIS_THRESHOLD) {
      const key = leftX > 0 ? 'ArrowRight' : 'ArrowLeft';
      simulateKeyPress(key, true);
      setTimeout(() => simulateKeyPress(key, false), 50);
    }
    if (Math.abs(leftY) > AXIS_THRESHOLD) {
      const key = leftY > 0 ? 'ArrowDown' : 'ArrowUp';
      simulateKeyPress(key, true);
      setTimeout(() => simulateKeyPress(key, false), 50);
    }
  }, [simulateKeyPress]);

  const pollGamepad = useCallback(() => {
    const gamepads = navigator.getGamepads();
    
    // Find the first connected gamepad
    if (gamepadIndexRef.current === null) {
      for (let i = 0; i < gamepads.length; i++) {
        const gp = gamepads[i];
        if (gp) {
          gamepadIndexRef.current = i;
          console.log(`Gamepad connected at index ${i}:`, gp.id);
          break;
        }
      }
    }

    const gamepad = gamepadIndexRef.current !== null ? gamepads[gamepadIndexRef.current] : null;
    
    if (!gamepad) {
      gamepadIndexRef.current = null;
      previousStateRef.current = null;
      return;
    }

    const currentState: GamepadState = {
      buttons: gamepad.buttons.map((button) => ({
        pressed: button.pressed,
        touched: button.touched,
        value: button.value,
      })),
      axes: [...gamepad.axes],
    };

    // Handle button presses
    if (previousStateRef.current) {
      currentState.buttons.forEach((button, index) => {
        const previousButton = previousStateRef.current!.buttons[index];
        
        if (button.pressed !== previousButton.pressed) {
          const mappedKey = mapping[index];
          if (mappedKey) {
            simulateKeyPress(mappedKey, button.pressed);
          }
        }
      });
    }

    // Handle axis movement
    handleAxisMovement(currentState.axes);

    previousStateRef.current = currentState;
  }, [mapping, simulateKeyPress, handleAxisMovement]);

  useEffect(() => {
    let animationFrameId: number;

    const gameLoop = () => {
      pollGamepad();
      animationFrameId = requestAnimationFrame(gameLoop);
    };

    // Start the game loop
    animationFrameId = requestAnimationFrame(gameLoop);

    // Handle gamepad connection events
    const handleGamepadConnected = (e: GamepadEvent) => {
      console.log('Gamepad connected:', e.gamepad.id);
      gamepadIndexRef.current = e.gamepad.index;
    };

    const handleGamepadDisconnected = (e: GamepadEvent) => {
      console.log('Gamepad disconnected:', e.gamepad.id);
      if (gamepadIndexRef.current === e.gamepad.index) {
        gamepadIndexRef.current = null;
        previousStateRef.current = null;
      }
    };

    window.addEventListener('gamepadconnected', handleGamepadConnected);
    window.addEventListener('gamepaddisconnected', handleGamepadDisconnected);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('gamepadconnected', handleGamepadConnected);
      window.removeEventListener('gamepaddisconnected', handleGamepadDisconnected);
    };
  }, [pollGamepad]);

  return {
    isConnected: gamepadIndexRef.current !== null,
    isEnabled: isEnabledRef.current,
  };
};
