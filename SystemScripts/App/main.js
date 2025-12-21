const { app, BrowserWindow } = require('electron')

function createWindow () {
  const win = new BrowserWindow({
    fullscreen: true,
    frame: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
      // PAS de partition temporaire
    }
  })

  win.loadURL('http://localhost:3000')
}

const { session } = require('electron')

const persistSession = session.fromPartition('persist:main')

const win = new BrowserWindow({
  webPreferences: {
    session: persistSession
  }
})

app.whenReady().then(createWindow)
