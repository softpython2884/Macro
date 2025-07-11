
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
  private axisStates: { [key: number]: boolean } = {}; // Tracks if an axis is currently "active" to prevent spam
  private axisDebounceTime = 160; // ms, a bit more than 150 to be safe

  constructor() {
    this.handleGamepadConnected = this.handleGamepadConnected.bind(this);
    this.handleGamepadDisconnected = this.handleGamepadDisconnected.bind(this);
    this.pollGamepad = this.pollGamepad.bind(this);
  }

  public start() {
    this.stop(); // Ensure no lingering listeners
    window.addEventListener('gamepadconnected', this.handleGamepadConnected);
    window.addEventListener('gamepaddisconnected', this.handleGamepadDisconnected);
    this.checkForConnectedGamepad();
  }

  public stop() {
    window.removeEventListener('gamepadconnected', this.handleGamepadConnected);
    window.removeEventListener('gamepaddisconnected', this.handleGamepadDisconnected);
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private checkForConnectedGamepad() {
    const gamepads = navigator.getGamepads();
    for (const gamepad of gamepads) {
      if (gamepad) {
        this.connectGamepad(gamepad);
        return; // Connect to the first one found
      }
    }
  }

  private handleGamepadConnected(event: GamepadEvent) {
    if (this.gamepadIndex === null) {
      this.connectGamepad(event.gamepad);
    }
  }

  private connectGamepad(gamepad: Gamepad) {
    console.log(`Gamepad connected at index ${gamepad.index}: ${gamepad.id}.`);
    this.gamepadIndex = gamepad.index;
    this.buttonStates = Array(gamepad.buttons.length).fill(false);
    
    // Initialize axis states
    GAMEPAD_AXIS_MAP.forEach(map => {
      this.axisStates[map.axis] = false;
    });

    if (!this.animationFrameId) {
        this.pollGamepad();
    }
  }

  private handleGamepadDisconnected(event: GamepadEvent) {
    if (event.gamepad.index === this.gamepadIndex) {
      console.log('Gamepad disconnected.');
      this.gamepadIndex = null;
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
    }
  }

  private dispatchKeyEvent(key: string, type: 'keydown' | 'keyup') {
    const activeElement = document.activeElement;
    const isInput = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA');

    if (!isInput || ['a', 'b', 'x', 'y'].includes(key.toLowerCase())) {
        window.dispatchEvent(new KeyboardEvent(type, { key: key, bubbles: true }));
    }
  }

  private pollGamepad() {
    if (this.gamepadIndex === null) {
      this.animationFrameId = requestAnimationFrame(this.pollGamepad);
      return;
    }

    const gamepad = navigator.getGamepads()[this.gamepadIndex];
    if (!gamepad) {
      this.animationFrameId = requestAnimationFrame(this.pollGamepad);
      return;
    }

    // Handle Buttons (A, B, X, Y, D-pad etc.)
    gamepad.buttons.forEach((button, index) => {
      const isPressed = button.pressed;
      const wasPressed = this.buttonStates[index];

      if (isPressed && !wasPressed) {
        const key = GAMEPAD_BUTTON_MAP[index];
        if (key) {
          this.dispatchKeyEvent(key, 'keydown');
        }
      } else if (!isPressed && wasPressed) {
        const key = GAMEPAD_BUTTON_MAP[index];
        if (key) {
          this.dispatchKeyEvent(key, 'keyup');
        }
      }
      this.buttonStates[index] = isPressed;
    });

    // Handle Analog Sticks
    GAMEPAD_AXIS_MAP.forEach(({ axis, threshold, positiveKey, negativeKey }) => {
        const value = gamepad.axes[axis];

        if (Math.abs(value) > threshold) {
            if (!this.axisStates[axis]) { // Only fire once when threshold is crossed
                const keyToPress = value > 0 ? positiveKey : negativeKey;
                this.dispatchKeyEvent(keyToPress, 'keydown');
                this.axisStates[axis] = true;

                // Debounce
                setTimeout(() => {
                    this.axisStates[axis] = false;
                }, this.axisDebounceTime);
            }
        } else {
            // Reset state when back in deadzone
            this.axisStates[axis] = false;
        }
    });


    this.animationFrameId = requestAnimationFrame(this.pollGamepad);
  }
}
