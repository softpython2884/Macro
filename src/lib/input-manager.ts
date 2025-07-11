
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

export class GamepadInputManager {
  private gamepadIndex: number | null = null;
  private animationFrameId: number | null = null;
  private lastButtonState: boolean[] = [];
  private lastAxisState: number[] = [];
  private axisThreshold = 0.75;
  private axisDebounceTimeout: NodeJS.Timeout | null = null;
  private axisDebounceTime = 150; // ms

  constructor() {
    this.handleGamepadConnected = this.handleGamepadConnected.bind(this);
    this.handleGamepadDisconnected = this.handleGamepadDisconnected.bind(this);
    this.pollGamepad = this.pollGamepad.bind(this);
  }

  public start() {
    window.addEventListener('gamepadconnected', this.handleGamepadConnected);
    window.addEventListener('gamepaddisconnected', this.handleGamepadDisconnected);
    this.checkForConnectedGamepad();
  }

  public stop() {
    window.removeEventListener('gamepadconnected', this.handleGamepadConnected);
    window.removeEventListener('gamepaddisconnected', this.handleGamepadDisconnected);
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private checkForConnectedGamepad() {
    const gamepads = navigator.getGamepads();
    for (const gamepad of gamepads) {
      if (gamepad) {
        this.connectGamepad(gamepad);
        break;
      }
    }
  }

  private handleGamepadConnected(event: GamepadEvent) {
    this.connectGamepad(event.gamepad);
  }

  private connectGamepad(gamepad: Gamepad) {
    console.log(`Gamepad connected at index ${gamepad.index}: ${gamepad.id}.`);
    this.gamepadIndex = gamepad.index;
    this.lastButtonState = Array(gamepad.buttons.length).fill(false);
    this.lastAxisState = Array(gamepad.axes.length).fill(0);
    this.pollGamepad();
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
    // Only dispatch if not inside an input field
    const activeElement = document.activeElement;
    const isInput = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA');

    if (!isInput) {
        window.dispatchEvent(new KeyboardEvent(type, { key: key, bubbles: true }));
    }
  }

  private pollGamepad() {
    if (this.gamepadIndex === null) return;

    const gamepad = navigator.getGamepads()[this.gamepadIndex];
    if (!gamepad) {
      this.animationFrameId = requestAnimationFrame(this.pollGamepad);
      return;
    }

    // Handle Buttons (A, B, X, Y, D-pad etc.)
    gamepad.buttons.forEach((button, index) => {
      const isPressed = button.pressed;
      const wasPressed = this.lastButtonState[index];

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
      this.lastButtonState[index] = isPressed;
    });

    // Handle Analog Sticks (Navigation)
    const leftStickX = gamepad.axes[0];
    const leftStickY = gamepad.axes[1];

    if (!this.axisDebounceTimeout) {
        let keyToPress: string | null = null;
        if (leftStickY < -this.axisThreshold) keyToPress = 'ArrowUp';
        else if (leftStickY > this.axisThreshold) keyToPress = 'ArrowDown';
        else if (leftStickX < -this.axisThreshold) keyToPress = 'ArrowLeft';
        else if (leftStickX > this.axisThreshold) keyToPress = 'ArrowRight';
        
        if (keyToPress) {
            this.dispatchKeyEvent(keyToPress, 'keydown');
            this.axisDebounceTimeout = setTimeout(() => {
                this.axisDebounceTimeout = null;
            }, this.axisDebounceTime);
        }
    }


    this.animationFrameId = requestAnimationFrame(this.pollGamepad);
  }
}
