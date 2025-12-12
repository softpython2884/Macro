
import os
import time
import psutil
import keyboard
import threading
import pyautogui

class SystemController:
    def __init__(self):
        self.browser_process = "chrome.exe"
        self._running = False
    
    def kill_browser(self):
        print(f"[System] Attempting to kill {self.browser_process}...")
        killed_count = 0
        for proc in psutil.process_iter(['pid', 'name']):
            if proc.info['name'] and proc.info['name'].lower() == self.browser_process.lower():
                try:
                    psutil.Process(proc.info['pid']).terminate()
                    killed_count += 1
                except Exception as e:
                    print(f"[Error] Failed to kill {proc.info['name']}: {e}")
        return killed_count

    def alt_tab(self):
        pyautogui.hotkey('alt', 'tab')

    def start_listeners(self):
        """ Starts global hotkey listeners """
        # F9 Listener
        keyboard.add_hotkey('f9', self._handle_f9)
        print("[System] F9 Hotkey active (Long press to kill Chrome, Short to Alt-Tab)")
        # We can implement the 'long press' logic here if we want, or simplify.
        # The previous script did a custom 'wait' logic. 
        # Using keyboard.on_press / on_release is better for custom long-press logic.
        
        # Let's use the robust method from before just slightly cleaner
        self.key_press_time = 0
        keyboard.on_press_key("f9", self._on_f9_down)
        keyboard.on_release_key("f9", self._on_f9_up)

    def _on_f9_down(self, e):
        if self.key_press_time == 0:
            self.key_press_time = time.time()

    def _on_f9_up(self, e):
        if self.key_press_time == 0: return
        duration = time.time() - self.key_press_time
        self.key_press_time = 0
        
        if duration > 1.0: # 1 second hold
            print("[System] F9 Held -> Killing Browser")
            self.kill_browser()
        else:
            print("[System] F9 Press -> Alt Tab")
            self.alt_tab()

    def _handle_f9(self):
        # Placeholder if we used add_hotkey
        pass
