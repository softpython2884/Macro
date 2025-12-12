
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
config.read("config.ini")
browser_process = "chrome.exe"

# État d'appui
key_hold_time = {}
HOLD_THRESHOLD = 3  # secondes

def alt_tab():
    pyautogui.keyDown("alt")
    pyautogui.press("tab")
    pyautogui.keyUp("alt")

def kill_browser():
    for proc in psutil.process_iter(['pid', 'name']):
        if proc.info['name'] and proc.info['name'].lower() == browser_process.lower():
            try:
                psutil.Process(proc.info['pid']).terminate()
                print(f"[INFO] Fermé : {proc.info['name']}")
            except Exception as e:
                print(f"[ERREUR] Impossible de fermer {proc.info['name']}: {e}")

def handle_press(key_name):
    if key_name not in key_hold_time:
        key_hold_time[key_name] = time.time()

def handle_release(key_name):
    if key_name in key_hold_time:
        duration = time.time() - key_hold_time[key_name]
        del key_hold_time[key_name]
        if duration >= HOLD_THRESHOLD:
            kill_browser()
        else:
            alt_tab()

# Thread pour touche F9
def monitor_keyboard():
    keyboard.on_press_key("f9", lambda _: handle_press("f9"))
    keyboard.on_release_key("f9", lambda _: handle_release("f9"))
    keyboard.wait()

# Thread pour bouton Xbox
def monitor_gamepad():
    if get_gamepad is None:
        return
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
            time.sleep(1)
        except Exception as e:
            print("[ERREUR manette]", e)
            time.sleep(1)

if __name__ == "__main__":
    print("[✔] Script lancé. Maintiens F9 ou le bouton Xbox...")
    threading.Thread(target=monitor_keyboard, daemon=True).start()
    threading.Thread(target=monitor_gamepad, daemon=True).start()
    while True:
        time.sleep(1)
