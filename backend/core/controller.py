
import threading
import time
import pyautogui
from inputs import get_gamepad, UnpluggedError

class GamepadController:
    def __init__(self, speed=25):
        self.cursor_speed = speed
        self.running = False
        self.thread = None
        self._deadzone = 8000  # Adjust as needed
        pyautogui.FAILSAFE = False # Prevent corners from crashing

    def scale(self, val, in_min=-32768, in_max=32767, out_min=-1, out_max=1):
        """ Scales input value to range [-1, 1] applying deadzone """
        if abs(val) < self._deadzone:
            return 0
        
        # Adjust value to remove deadzone jump
        masked_val = val - (self._deadzone if val > 0 else -self._deadzone)
        masked_max = in_max - self._deadzone
        
        # Calculate ratio
        return float(masked_val) / float(masked_max)

    def _loop(self):
        print("🎮 Gamepad listener started")
        while self.running:
            try:
                events = get_gamepad()
                dx = dy = 0
                scroll_y = 0
                
                for event in events:
                    if event.code == "ABS_X":
                        dx = self.scale(event.state)
                    elif event.code == "ABS_Y":
                        # Invert Y for natural feel if needed, usually joystick up is neg? 
                        # Standard gamepads: Up is negative Y usually, but let's test.
                        # Actually inputs lib: Up is usually negative.
                        # pyautogui.move(x, y): y positive is down.
                        # So Up (-Y input) -> Up (-Y screen)
                        dy = self.scale(event.state) 
                    elif event.code == "BTN_SOUTH" and event.state == 1: # A button
                        pyautogui.click()
                    elif event.code == "BTN_EAST" and event.state == 1: # B button
                        pyautogui.rightClick()
                    elif event.code == "ABS_RY": # Right stick Y
                         # Scrolling
                        scroll = self.scale(event.state)
                        if abs(scroll) > 0.1:
                            # Scroll speed
                            scroll_amount = int(scroll * -5) # Invert for natural scroll
                            pyautogui.scroll(scroll_amount)

                # Move Mouse
                # Since get_gamepad() is blocking, we collect minimal state, but 
                # actually get_gamepad() returns ALL queued events.
                # If we rely solely on events to drive ticks, the cursor might only move when input changes.
                # However, joysticks send constant events slightly? No, usually only on change.
                # For smooth movement, we need to store state and apply it in a loop.
                # BUT, `inputs` is blocking.
                
                # REVISION: We need a non-blocking approach or a state-based approach.
                # `inputs` get_gamepad() blocks until an event.
                # If I hold the stick, does it spam events? NO.
                # So we need TWO threads: one to read input and update State, one to apply State to Mouse.
                
                # For this first pass, I'll stick to a simpler implementation, 
                # but we might need to change `inputs` usage.
                # Actually, `controller_cursor.py` worked because it probably got enough noise or just worked on changes.
                # But holding a perfect stick value might stop the cursor.
                # Let's fix that immediately.
                
                pass 

            except UnpluggedError:
                time.sleep(1)
            except Exception as e:
                print(f"Gamepad Error: {e}")
                time.sleep(0.1)

    # Re-writing _loop to be robust state-based
    def _input_listener(self):
        while self.running:
            try:
                events = get_gamepad()
                for event in events:
                    if event.code == "ABS_X":
                        self.state['dx'] = self.scale(event.state)
                    elif event.code == "ABS_Y":
                         # pyautogui Y+ is down. Stick Y- is up. 
                         # So existing mapped correctly? -1 (up) translates to -speed (up).
                        self.state['dy'] = self.scale(event.state)
                    elif event.code == "ABS_RY":
                        self.state['scroll'] = self.scale(event.state)
                    elif event.code == "BTN_SOUTH" and event.state == 1:
                        pyautogui.click()
                    elif event.code == "BTN_EAST" and event.state == 1:
                        pyautogui.rightClick()
            except UnpluggedError:
                # Reset state if unplugged
                self.state = {'dx': 0, 'dy': 0, 'scroll': 0}
                time.sleep(2)
            except Exception:
                time.sleep(0.1)

    def _motion_loop(self):
        while self.running:
            dx = self.state['dx']
            dy = self.state['dy']
            scroll = self.state['scroll']
            
            if abs(dx) > 0.05 or abs(dy) > 0.05:
                # Non-linear curve for precision + speed
                # out = sign * (val^2) * speed
                move_x = (dx**3) * self.cursor_speed * 1.5 if abs(dx) > 0.5 else dx * self.cursor_speed * 0.5
                move_y = (dy**3) * self.cursor_speed * 1.5 if abs(dy) > 0.5 else dy * self.cursor_speed * 0.5
                
                # Move relative
                pyautogui.move(move_x, move_y)
            
            if abs(scroll) > 0.1:
                pyautogui.scroll(int(scroll * -20)) # -20 speed
                
            time.sleep(0.01) # 100hz updates

    def start(self):
        if self.running: return
        self.running = True
        self.state = {'dx': 0, 'dy': 0, 'scroll': 0}
        
        self.thread_input = threading.Thread(target=self._input_listener, daemon=True)
        self.thread_motion = threading.Thread(target=self._motion_loop, daemon=True)
        
        self.thread_input.start()
        self.thread_motion.start()

    def stop(self):
        self.running = False

