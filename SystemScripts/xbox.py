import pygame
from pynput.keyboard import Controller, Key
import time

# Initialisation
pygame.init()
pygame.joystick.init()

keyboard = Controller()
active = True  # Script actif par défaut

# Attendre qu'une manette soit connectée
while pygame.joystick.get_count() == 0:
    print("⏳ En attente de la manette Xbox...")
    time.sleep(1)
    pygame.joystick.quit()
    pygame.joystick.init()

joystick = pygame.joystick.Joystick(0)
joystick.init()
print(f"🎮 Manette détectée : {joystick.get_name()}")

# Mapping des boutons (valable pour manette Xbox sur Pygame)
BUTTON_A = 0
BUTTON_B = 1
BUTTON_X = 2
BUTTON_Y = 3
BUTTON_LB = 4
BUTTON_RB = 5
BUTTON_MENU = 7  # Le bouton Start/Menu

DPAD_TO_KEY = {
    (0, 1): Key.up,
    (0, -1): Key.down,
    (-1, 0): Key.left,
    (1, 0): Key.right,
}

def press_key(k):
    keyboard.press(k)
    keyboard.release(k)

print("✅ Script activé. Appuie sur le bouton MENU pour activer/désactiver.")

# Boucle principale
while True:
    pygame.event.pump()

    # Gérer activation / désactivation
    if joystick.get_button(BUTTON_MENU):
        active = not active
        print(f"{'🟢 Activé' if active else '🔴 Désactivé'}")
        time.sleep(0.5)  # Anti double-clic

    if not active:
        time.sleep(0.1)
        continue

    # Boutons simples
    if joystick.get_button(BUTTON_LB):
        press_key('e')
        time.sleep(0.1)

    if joystick.get_button(BUTTON_RB):
        press_key('q')
        time.sleep(0.1)

    if joystick.get_button(BUTTON_A):
        press_key(Key.enter)
        time.sleep(0.1)

    if joystick.get_button(BUTTON_B):
        press_key(Key.backspace)
        time.sleep(0.1)

    if joystick.get_button(BUTTON_X):
        press_key('x')
        time.sleep(0.1)

    if joystick.get_button(BUTTON_Y):
        press_key('y')
        time.sleep(0.1)

    # DPad
    hat = joystick.get_hat(0)
    if hat in DPAD_TO_KEY:
        press_key(DPAD_TO_KEY[hat])
        time.sleep(0.1)

    # Joysticks (utilisés comme flèches)
    axis_threshold = 0.5
    lx = joystick.get_axis(0)
    ly = joystick.get_axis(1)

    rx = joystick.get_axis(3)
    ry = joystick.get_axis(4)

    if ly < -axis_threshold:
        press_key(Key.up)
        time.sleep(0.1)
    elif ly > axis_threshold:
        press_key(Key.down)
        time.sleep(0.1)

    if lx < -axis_threshold:
        press_key(Key.left)
        time.sleep(0.1)
    elif lx > axis_threshold:
        press_key(Key.right)
        time.sleep(0.1)

    # Joystick droit (facultatif si tu veux plus de contrôle)
    if ry < -axis_threshold:
        press_key(Key.up)
        time.sleep(0.1)
    elif ry > axis_threshold:
        press_key(Key.down)
        time.sleep(0.1)

    if rx < -axis_threshold:
        press_key(Key.left)
        time.sleep(0.1)
    elif rx > axis_threshold:
        press_key(Key.right)
        time.sleep(0.1)

    time.sleep(0.01)
