
import sys
import pyautogui

key = sys.argv[1]

special = {
    "ESPACE": "space",
    "TAB": "tab",
    "ENTRÉE": "enter",
    "SUPPR": "delete",
    "←": "backspace"
}

if key in special:
    pyautogui.press(special[key])
else:
    pyautogui.write(key)
