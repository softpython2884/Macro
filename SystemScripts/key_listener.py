import time
import threading
import configparser
import os
import psutil
import keyboard

try:
    from inputs import get_gamepad, UnpluggedError
except ImportError:
    get_gamepad = None

import pyautogui

# Lire la config
config = configparser.ConfigParser()
# Path relative to this script's location
script_dir = os.path.dirname(os.path.abspath(__file__))
config_path = os.path.join(script_dir, 'config.ini')
config.read(config_path)

browser_process = config.get("general", "browser", fallback="chrome.exe").strip()

# État d'appui
key_hold_time = {}
HOLD_THRESHOLD = 3  # secondes

def alt_tab():
    pyautogui.keyDown("alt")
    pyautogui.press("tab")
    pyautogui.keyUp("alt")

def kill_browser():
    print(f"[INFO] Attempting to close process: {browser_process}")
    for proc in psutil.process_iter(['pid', 'name']):
        if proc.info['name'] and proc.info['name'].lower() == browser_process.lower():
            try:
                psutil.Process(proc.info['pid']).terminate()
                print(f"[INFO] Terminated: {proc.info['name']}")
            except Exception as e:
                print(f"[ERROR] Could not terminate {proc.info['name']}: {e}")

def handle_press(key_name):
    if key_name not in key_hold_time:
        key_hold_time[key_name] = time.time()
        print(f"[INFO] {key_name} pressed. Hold for {HOLD_THRESHOLD}s to kill browser.")

def handle_release(key_name):
    if key_name in key_hold_time:
        duration = time.time() - key_hold_time[key_name]
        del key_hold_time[key_name]
        print(f"[INFO] {key_name} released after {duration:.2f}s.")
        if duration >= HOLD_THRESHOLD:
            kill_browser()
        else:
            alt_tab()

# Thread pour touche F9
def monitor_keyboard():
    keyboard.on_press_key("f9", lambda _: handle_press("f9"))
    keyboard.on_release_key("f9", lambda _: handle_release("f9"))
    print("[INFO] Keyboard listener for F9 is active.")
    keyboard.wait()

# Thread pour bouton Xbox
def monitor_gamepad():
    if get_gamepad is None:
        print("[WARN] 'inputs' library not found. Gamepad listener disabled. Run 'pip install inputs'.")
        return
        
    print("[INFO] Gamepad listener for Xbox button is active.")
    pressed = False
    while True:
        try:
            events = get_gamepad()
            for event in events:
                if event.code == "BTN_MODE":
                    if event.state == 1 and not pressed:
                        handle_press("xbox")
                        pressed = True
                    elif event.state == 0 and pressed:
                        handle_release("xbox")
                        pressed = False
        except UnpluggedError:
            print("[INFO] Gamepad unplugged. Waiting for connection...")
            time.sleep(5)
        except Exception as e:
            print(f"[ERROR Gamepad] An unexpected error occurred: {e}")
            time.sleep(5)

if __name__ == "__main__":
    print("--- Macro System Listener v2 ---")
    print(f"Target browser process: {browser_process}")
    print("Action: Tap F9/Xbox for Alt+Tab, Hold for 3s to kill browser.")
    
    threading.Thread(target=monitor_keyboard, daemon=True).start()
    threading.Thread(target=monitor_gamepad, daemon=True).start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nScript stopped by user.")
