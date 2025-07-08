
import sys
import pyautogui

key = sys.argv[1].upper()

special = {
    "ESPACE": " ",
    "TAB": "tab",
    "ENTRÉE": "enter",
    "MAJ": "shift",
    "SUPPR": "delete",
    "←": "backspace"
}

if key in special:
    pyautogui.press(special[key])
else:
    pyautogui.write(key.lower())
