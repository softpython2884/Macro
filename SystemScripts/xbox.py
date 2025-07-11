import pygame
from pynput.keyboard import Controller, Key
import time

# Initialisation
pygame.init()
pygame.joystick.init()

keyboard = Controller()
active = True  # Script actif par défaut

# Attente de la manette
while pygame.joystick.get_count() == 0:
    print("⏳ En attente de la manette Xbox...")
    time.sleep(1)
    pygame.joystick.quit()
    pygame.joystick.init()

joystick = pygame.joystick.Joystick(0)
joystick.init()
print(f"🎮 Manette détectée : {joystick.get_name()}")

# Boutons (Xbox)
BUTTON_A = 0
BUTTON_B = 1
BUTTON_X = 2
BUTTON_Y = 3
BUTTON_LB = 4  # Gauche → Q
BUTTON_RB = 5  # Droite → E
BUTTON_MENU = 7  # Start/Menu

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

    # Activer/désactiver le script
    if joystick.get_button(BUTTON_MENU):
        active = not active
        print(f"{'🟢 Activé' if active else '🔴 Désactivé'}")
        time.sleep(0.5)  # Pour éviter le double clic

    if not active:
        time.sleep(0.1)
        continue

    # Boutons simples
    if joystick.get_button(BUTTON_LB):
        press_key('q')  # Gauche → Q
        time.sleep(0.1)

    if joystick.get_button(BUTTON_RB):
        press_key('e')  # Droite → E
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

    # Joystick (avec seuil pour éviter les dérives)
    axis_threshold = 0.5

    # Gauche
    lx = joystick.get_axis(0)
    ly = joystick.get_axis(1)

    # Droite
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
