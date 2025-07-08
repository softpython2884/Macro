import threading
import pyautogui
import time

from inputs import get_gamepad

cursor_speed = 25  # Vitesse du curseur

def scale(val, in_min=-32768, in_max=32767, out_min=-1, out_max=1):
    return out_min + (float(val - in_min) / float(in_max - in_min) * (out_max - out_min))

def move_cursor():
    while True:
        try:
            events = get_gamepad()
            dx = dy = 0
            for event in events:
                if event.code == "ABS_X":
                    dx = scale(event.state) * cursor_speed
                elif event.code == "ABS_Y":
                    dy = scale(event.state) * cursor_speed
                elif event.code == "BTN_SOUTH" and event.state == 1:  # bouton A pressé
                    pyautogui.click()
            if abs(dx) > 0.1 or abs(dy) > 0.1:
                x, y = pyautogui.position()
                pyautogui.moveTo(x + dx, y + dy)
        except Exception:
            time.sleep(0.1)

if __name__ == "__main__":
    threading.Thread(target=move_cursor, daemon=True).start()
    print("Contrôle manette activé (curseur + clic A). Ctrl+C pour quitter.")
    while True:
        time.sleep(1)
