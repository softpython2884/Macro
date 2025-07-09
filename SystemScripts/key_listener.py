import keyboard
import subprocess
import platform
from inputs import get_gamepad
import threading
import time
import configparser
import os

def get_browser_from_config():
    """Reads the browser executable from config.ini."""
    try:
        config = configparser.ConfigParser()
        # Path relative to this script's location
        script_dir = os.path.dirname(os.path.abspath(__file__))
        config_path = os.path.join(script_dir, 'config.ini')

        if not os.path.exists(config_path):
            print(f"Config file not found at {config_path}. Creating with default.")
            default_config = '[general]\nbrowser = chrome.exe\nsetupconfig = false\n'
            with open(config_path, 'w') as configfile:
                configfile.write(default_config)
            return 'chrome.exe'
            
        config.read(config_path)
        browser = config.get('general', 'browser', fallback='chrome.exe')
        print(f"Using browser from config: {browser}")
        return browser
    except Exception as e:
        print(f"Error reading config.ini, defaulting to chrome.exe. Error: {e}")
        return 'chrome.exe'

def close_browser():
    """Closes the browser specified in the config file."""
    browser_executable = get_browser_from_config()
    current_os = platform.system()
    
    print(f"Attempting to close browser: {browser_executable} on {current_os}...")

    try:
        if current_os == "Windows":
            process_name = browser_executable
            # shell=True is needed for commands like taskkill on Windows
            subprocess.run(["taskkill", "/F", "/IM", process_name], check=True, shell=True, capture_output=True, text=True)
            print(f"{process_name} process terminated.")
        
        elif current_os == "Darwin": # macOS
            process_map = {
                "chrome.exe": "Google Chrome",
                "msedge.exe": "Microsoft Edge",
                "firefox.exe": "Firefox"
            }
            process_name = process_map.get(browser_executable.lower(), "Google Chrome")
            subprocess.run(["pkill", "-f", process_name], check=True, capture_output=True, text=True)
            print(f"'{process_name}' process terminated.")
        
        elif current_os == "Linux":
            process_map = {
                "chrome.exe": "chrome",
                "msedge.exe": "msedge",
                "firefox.exe": "firefox"
            }
            process_name = process_map.get(browser_executable.lower(), "chrome")
            subprocess.run(["pkill", process_name], check=True, capture_output=True, text=True)
            print(f"'{process_name}' process terminated.")

    except subprocess.CalledProcessError as e:
        stderr_lower = e.stderr.lower() if e.stderr else ""
        if "could not be found" in stderr_lower or "no process found" in stderr_lower:
            print(f"Browser process was not running.")
        else:
            print(f"Error closing browser: {e.stderr}")
    except FileNotFoundError:
        print("Error: 'taskkill' or 'pkill' command not found. Make sure it's in your system's PATH.")


def detect_keyboard():
    print("Keyboard listener started. Waiting for F9...")
    keyboard.wait('F9')
    print("F9 detected!")
    close_browser()
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
                    close_browser()
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
