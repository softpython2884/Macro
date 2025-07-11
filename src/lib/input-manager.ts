
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
  private axisStates: { [key: string]: boolean } = {}; // Tracks if an axis is currently "active" to prevent spam
  private axisDebounceTime = 160; // ms

  constructor() {
    this.pollGamepad = this.pollGamepad.bind(this);
  }

  public start() {
    this.stop(); // Ensure no lingering listeners
    console.log("GamepadInputManager started. Listening for connections...");
    this.animationFrameId = requestAnimationFrame(this.pollGamepad);
  }

  public stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private dispatchKeyEvent(key: string, type: 'keydown' | 'keyup') {
    window.dispatchEvent(new KeyboardEvent(type, { key: key, bubbles: true }));
  }

  private pollGamepad() {
    const gamepads = navigator.getGamepads();
    const connectedGamepad = gamepads[0] || gamepads[1] || gamepads[2] || gamepads[3] || null;

    if (connectedGamepad) {
      if (this.gamepadIndex !== connectedGamepad.index) {
        console.log(`Gamepad connected at index ${connectedGamepad.index}: ${connectedGamepad.id}.`);
        this.gamepadIndex = connectedGamepad.index;
        this.buttonStates = Array(connectedGamepad.buttons.length).fill(false);
        GAMEPAD_AXIS_MAP.forEach(map => {
            this.axisStates[`${map.axis}+`] = false;
            this.axisStates[`${map.axis}-`] = false;
        });
      }

      // Handle Buttons (A, B, X, Y, D-pad etc.)
      connectedGamepad.buttons.forEach((button, index) => {
        const isPressed = button.pressed;
        const wasPressed = this.buttonStates[index];

        if (isPressed !== wasPressed) {
          const key = GAMEPAD_BUTTON_MAP[index];
          if (key) {
            this.dispatchKeyEvent(key, isPressed ? 'keydown' : 'keyup');
          }
          this.buttonStates[index] = isPressed;
        }
      });

      // Handle Analog Sticks
      GAMEPAD_AXIS_MAP.forEach(({ axis, threshold, positiveKey, negativeKey }) => {
        const value = connectedGamepad!.axes[axis];
        const keyPositive = `${axis}+`;
        const keyNegative = `${axis}-`;

        // Positive direction
        if (value > threshold) {
          if (!this.axisStates[keyPositive]) {
            this.dispatchKeyEvent(positiveKey, 'keydown');
            this.axisStates[keyPositive] = true;
            setTimeout(() => { this.axisStates[keyPositive] = false; }, this.axisDebounceTime);
          }
        } else {
            this.axisStates[keyPositive] = false;
        }

        // Negative direction
        if (value < -threshold) {
          if (!this.axisStates[keyNegative]) {
            this.dispatchKeyEvent(negativeKey, 'keydown');
            this.axisStates[keyNegative] = true;
            setTimeout(() => { this.axisStates[keyNegative] = false; }, this.axisDebounceTime);
          }
        } else {
          this.axisStates[keyNegative] = false;
        }
      });
    } else if (this.gamepadIndex !== null) {
      console.log(`Gamepad at index ${this.gamepadIndex} disconnected.`);
      this.gamepadIndex = null;
    }
    
    this.animationFrameId = requestAnimationFrame(this.pollGamepad);
  }
}
