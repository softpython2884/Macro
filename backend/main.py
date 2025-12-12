
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import threading
import asyncio
from core.controller import GamepadController
from core.system import SystemController

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances
gamepad = GamepadController()
system = SystemController()

@app.on_event("startup")
def startup_event():
    print("--- 🚀 Macro Backend Starting ---")
    # Start Gamepad Thread
    gamepad.start()
    # Start System Listeners
    system.start_listeners()

@app.on_event("shutdown")
def shutdown_event():
    print("--- 🛑 Macro Backend Stopping ---")
    gamepad.stop()

@app.get("/")
def read_root():
    return {"status": "online", "modules": ["gamepad", "system"]}

@app.get("/system/kill-browser")
def api_kill_browser():
    count = system.kill_browser()
    return {"status": "success", "killed_count": count}

@app.websocket("/ws/input")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            # Handle virtual keyboard input
            # Expected { "type": "keypress", "key": "A" }
            if data.get("type") == "keypress":
                key = data.get("key")
                import pyautogui
                # Handle special keys map if needed, or simple write
                if len(key) > 1 and key.lower() in ['enter', 'tab', 'space', 'backspace']:
                     pyautogui.press(key.lower())
                else:
                    pyautogui.write(key)
            
    except Exception as e:
        print(f"WebSocket Error: {e}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
