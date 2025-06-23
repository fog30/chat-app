const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow () {
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      nodeIntegration: false
    }
  });

  win.loadFile('index.html'); // Your main chat HTML
}

app.whenReady().then(() => {
  createWindow();
});
