import pygame
from pynput.keyboard import Controller, Key
import time
import subprocess

# =====================
# CONFIG
# =====================
DEADZONE = 0.4
REPEAT_DELAY = 0.2      # délai entre répétitions de direction
BUTTON_DELAY = 0.15     # anti-spam boutons
TOGGLE_BUTTON = 7       # MENU ☰
KILL_GAMEBAR = True

# =====================
# INIT
# =====================
keyboard = Controller()
active = True

pygame.init()
pygame.joystick.init()

# =====================
# KILL XBOX GAME BAR
# =====================
def kill_xbox_gamebar():
    procs = [
        "GameBar.exe",
        "GameBarFTServer.exe",
        "XboxGameBarWidgets.exe",
        "XboxGameBar.exe"
    ]
    for p in procs:
        subprocess.run(
            ["taskkill", "/f", "/im", p],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )

if KILL_GAMEBAR:
    kill_xbox_gamebar()

# =====================
# WAIT CONTROLLER
# =====================
while pygame.joystick.get_count() == 0:
    print("⏳ En attente de la manette...")
    time.sleep(1)
    pygame.joystick.quit()
    pygame.joystick.init()

joystick = pygame.joystick.Joystick(0)
joystick.init()

print(f"🎮 {joystick.get_name()}")
print("☰ MENU = Activer / Désactiver")

# =====================
# UTILS
# =====================
last_toggle = 0
last_move_time = {
    Key.up: 0,
    Key.down: 0,
    Key.left: 0,
    Key.right: 0
}

last_button_time = {}

def tap(key):
    keyboard.press(key)
    keyboard.release(key)

# répétition directions
def can_repeat(key):
    now = time.time()
    if now - last_move_time[key] >= REPEAT_DELAY:
        last_move_time[key] = now
        return True
    return False

# anti-spam boutons
def button_tap(btn, key):
    now = time.time()
    if joystick.get_button(btn):
        if btn not in last_button_time or now - last_button_time[btn] > BUTTON_DELAY:
            tap(key)
            last_button_time[btn] = now

# =====================
# LOOP
# =====================
while True:
    pygame.event.pump()

    # TOGGLE SCRIPT
    if joystick.get_button(TOGGLE_BUTTON):
        if time.time() - last_toggle > 0.5:
            active = not active
            print("🟢 Activé" if active else "🔴 Désactivé")
            last_toggle = time.time()

    if not active:
        time.sleep(0.05)
        continue

    # =====================
    # STICK GAUCHE (MENU)
    # =====================
    lx = joystick.get_axis(0)
    ly = joystick.get_axis(1)

    if ly < -DEADZONE and can_repeat(Key.up):
        tap(Key.up)
    elif ly > DEADZONE and can_repeat(Key.down):
        tap(Key.down)

    if lx < -DEADZONE and can_repeat(Key.left):
        tap(Key.left)
    elif lx > DEADZONE and can_repeat(Key.right):
        tap(Key.right)

    # =====================
    # DPAD
    # =====================
    hat = joystick.get_hat(0)

    if hat == (0, 1) and can_repeat(Key.up):
        tap(Key.up)
    elif hat == (0, -1) and can_repeat(Key.down):
        tap(Key.down)
    elif hat == (-1, 0) and can_repeat(Key.left):
        tap(Key.left)
    elif hat == (1, 0) and can_repeat(Key.right):
        tap(Key.right)

    # =====================
    # BOUTONS
    # =====================
    button_tap(0, Key.enter)   # A
    button_tap(1, Key.esc)     # B
    button_tap(2, 'x')         # X
    button_tap(3, 'y')         # Y
    button_tap(4, 'q')         # LB → Q
    button_tap(5, 'e')         # RB → E

    time.sleep(0.01)
