# System Scripts

This directory contains external scripts (Python, Node.js, etc.) that run alongside the main Macro application to provide system-level functionality that is not possible from within a web browser.

**These scripts must be run manually and separately from the main application.**

## Scripts

### `key_listener.py`

This script listens for global keyboard and gamepad events to provide a "panic button" to close the external browser window and return focus to Macro.

- **Keyboard:** Press `F9`
- **Gamepad:** Press the `Xbox/Guide` button

#### Requirements

- Python 3.x
- Required packages are listed in `requirements.txt`.

#### Setup

1.  Navigate to this directory in your terminal:
    ```sh
    cd SystemScripts
    ```
2.  Install the required Python packages:
    ```sh
    pip install -r requirements.txt
    ```

#### Running the Script

To start the listener, run the following command from this directory (`SystemScripts`):

```sh
python key_listener.py
```

You should keep this script running in a separate terminal window while you use Macro.
