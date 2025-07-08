import keyboard
import subprocess
import platform
from inputs import get_gamepad
import threading
import time

def close_chrome():
    # Note: This will close ALL instances of the specified browser.
    browser_process_name = "chrome.exe"
    print(f"Attempting to close {browser_process_name}...")

    try:
        if platform.system() == "Windows":
            # Use taskkill on Windows
            subprocess.run(["taskkill", "/F", "/IM", browser_process_name], check=True, shell=True, capture_output=True, text=True)
        elif platform.system() == "Darwin": # macOS
            subprocess.run(["pkill", "-f", "Google Chrome"], check=True, capture_output=True, text=True)
        elif platform.system() == "Linux":
            subprocess.run(["pkill", "chrome"], check=True, capture_output=True, text=True)
        print(f"{browser_process_name} process terminated.")
    except subprocess.CalledProcessError as e:
        # It's common for taskkill to error if the process isn't found, which is not a critical failure.
        if "could not be found" in e.stderr:
            print(f"{browser_process_name} was not running.")
        else:
            print(f"Error closing {browser_process_name}: {e.stderr}")
    except FileNotFoundError:
        print("Error: 'taskkill' or 'pkill' command not found. Make sure it's in your system's PATH.")


def detect_keyboard():
    print("Keyboard listener started. Waiting for F9...")
    keyboard.wait('F9')
    print("F9 detected!")
    close_chrome()
    # Relaunch the listener to catch the next press
    threading.Thread(target=detect_keyboard, daemon=True).start()


def detect_xbox_button():
    print("Gamepad listener started. Waiting for Xbox button...")
    try:
        while True:
            events = get_gamepad()
            for event in events:
                # BTN_MODE is often the code for the Xbox/Guide button
                if event.code == "BTN_MODE" and event.state == 1:
                    print("Xbox button detected!")
                    close_chrome()
    except Exception:
        # This will happen if no gamepad is connected. We'll wait and retry.
        print("[INFO] No gamepad detected. Retrying in 10 seconds...")
        time.sleep(10)
        # Relaunch the listener
        threading.Thread(target=detect_xbox_button, daemon=True).start()


# --- Main Execution ---
if __name__ == "__main__":
    print("--- Macro System Listener ---")
    print("This script runs in the background to add system-level controls.")
    
    # Run listeners in parallel
    threading.Thread(target=detect_keyboard, daemon=True).start()
    threading.Thread(target=detect_xbox_button, daemon=True).start()

    # Keep the main thread alive to allow daemon threads to run
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("Script stopped by user.")
