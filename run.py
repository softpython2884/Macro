import subprocess
import os
import time

# Fonction pour exécuter une commande dans un dossier donné et attendre qu'elle démarre
def run_command(command, cwd=None):
    process = subprocess.Popen(command, shell=True, cwd=cwd)
    return process

# Chemins
root = os.getcwd()
system_scripts = os.path.join(root, 'SystemScripts')
macro_controller = os.path.join(system_scripts, 'macro-controller')

# Étape 1 : npm run prod
print("🔧 Démarrage de npm run prod...")
npm_process = run_command('npm run prod')
time.sleep(5)  # Optionnel : attendre un peu que le serveur démarre

# Étape 2 : server.js
print("🟢 Démarrage de server.js...")
server_process = run_command('node server.js', macro_controller)
time.sleep(3)

# Étape 3 : key_listener.py
print("🎧 Démarrage de key_listener.py...")
key_listener_process = run_command('python key_listener.py', system_scripts)

# Étape 4 : controller_cursor.py et controller_input.py
print("🖱️ Démarrage des contrôleurs...")
cursor_process = run_command('python controller_cursor.py', macro_controller)
input_process = run_command('python controller_input.py', macro_controller)