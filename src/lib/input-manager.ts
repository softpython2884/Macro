/**
 * @fileoverview Manages gamepad input and maps it to keyboard events for navigation.
 */

// Mapping of Gamepad API button indices to keyboard keys
const GAMEPAD_BUTTON_MAP: { [key: number]: string } = {
  0: 'a', // A button (main action)
  1: 'b', // B button (back)
  2: 'x', // X button
  3: 'y', // Y button
  4: 'q', // Left bumper
  5: 'e', // Right bumper
  12: 'ArrowUp',    // D-pad Up
  13: 'ArrowDown',  // D-pad Down
  14: 'ArrowLeft',  // D-pad Left
  15: 'ArrowRight', // D-pad Right
};

// Mapping for axis-based controls, including deadzone and direction
const GAMEPAD_AXIS_MAP = [
  { axis: 0, threshold: 0.75, positiveKey: 'ArrowRight', negativeKey: 'ArrowLeft' }, // Left Stick X
  { axis: 1, threshold: 0.75, positiveKey: 'ArrowDown', negativeKey: 'ArrowUp' },   // Left Stick Y
  { axis: 2, threshold: 0.75, positiveKey: 'ArrowRight', negativeKey: 'ArrowLeft' }, // Right Stick X (often used for camera/scroll)
  { axis: 3, threshold: 0.75, positiveKey: 'ArrowDown', negativeKey: 'ArrowUp' },   // Right Stick Y
];

export class GamepadInputManager {
  private gamepadIndex: number | null = null;
  private animationFrameId: number | null = null;
  private buttonStates: boolean[] = [];
  private axisStates: { [key: string]: boolean } = {}; // Tracks if an axis key is "down"
  private axisDebounceTime = 160; // ms
  private axisDebounceTimers: { [key: string]: NodeJS.Timeout } = {};

  constructor() {
    this.pollGamepad = this.pollGamepad.bind(this);
  }

  public start() {
    this.stop(); // Ensure no lingering listeners
    console.log("GamepadInputManager started. Listening for connections...");
    window.addEventListener('gamepadconnected', (e) => {
        console.log(`Gamepad connected at index ${e.gamepad.index}: ${e.gamepad.id}.`);
        if (this.gamepadIndex === null) {
            this.gamepadIndex = e.gamepad.index;
        }
    });
    window.addEventListener('gamepaddisconnected', (e) => {
        console.log(`Gamepad disconnected from index ${e.gamepad.index}.`);
        if (this.gamepadIndex === e.gamepad.index) {
            this.gamepadIndex = null;
        }
    });
    this.animationFrameId = requestAnimationFrame(this.pollGamepad);
  }

  public stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private dispatchKeyEvent(key: string, type: 'keydown' | 'keyup') {
    window.dispatchEvent(new KeyboardEvent(type, { key: key, bubbles: true, cancelable: true }));
  }

  private pollGamepad() {
    const gamepads = navigator.getGamepads();
    if (this.gamepadIndex === null) {
        // Try to find a connected gamepad if we don't have one
        for (const gp of gamepads) {
            if (gp) {
                this.gamepadIndex = gp.index;
                console.log(`Gamepad detected at index ${gp.index}: ${gp.id}.`);
                break;
            }
        }
    }
    
    const gamepad = this.gamepadIndex !== null ? gamepads[this.gamepadIndex] : null;

    if (gamepad) {
      // Handle Buttons (A, B, X, Y, D-pad etc.)
      gamepad.buttons.forEach((button, index) => {
        const isPressed = button.pressed;
        const wasPressed = this.buttonStates[index];
        const key = GAMEPAD_BUTTON_MAP[index];
        
        if (key) {
            if (isPressed && !wasPressed) {
                this.dispatchKeyEvent(key, 'keydown');
            } else if (!isPressed && wasPressed) {
                this.dispatchKeyEvent(key, 'keyup');
            }
        }
        this.buttonStates[index] = isPressed;
      });

      // Handle Analog Sticks
      GAMEPAD_AXIS_MAP.forEach(({ axis, threshold, positiveKey, negativeKey }) => {
        const value = gamepad.axes[axis];

        // --- Positive direction ---
        const positiveStateKey = `${axis}+`;
        if (value > threshold) {
            if (!this.axisStates[positiveStateKey]) {
                this.dispatchKeyEvent(positiveKey, 'keydown');
                this.axisStates[positiveStateKey] = true;
                
                // Clear any existing timer to prevent premature release
                if (this.axisDebounceTimers[positiveStateKey]) {
                    clearTimeout(this.axisDebounceTimers[positiveStateKey]);
                }
                // Set a timer to re-allow input after a delay
                this.axisDebounceTimers[positiveStateKey] = setTimeout(() => {
                    this.axisStates[positiveStateKey] = false;
                }, this.axisDebounceTime);
            }
        } 

        // --- Negative direction ---
        const negativeStateKey = `${axis}-`;
        if (value < -threshold) {
             if (!this.axisStates[negativeStateKey]) {
                this.dispatchKeyEvent(negativeKey, 'keydown');
                this.axisStates[negativeStateKey] = true;
                
                if (this.axisDebounceTimers[negativeStateKey]) {
                    clearTimeout(this.axisDebounceTimers[negativeStateKey]);
                }
                this.axisDebounceTimers[negativeStateKey] = setTimeout(() => {
                    this.axisStates[negativeStateKey] = false;
                }, this.axisDebounceTime);
            }
        }
      });

    }
    
    this.animationFrameId = requestAnimationFrame(this.pollGamepad);
  }
}
