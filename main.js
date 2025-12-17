const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const extractIcon = require('extract-file-icon');

// ---------------------
// PowerShell helper
// ---------------------
function runPS(scriptFile, ...args) {
  if (!fs.existsSync(scriptFile)) {
    console.error('PowerShell script not found:', scriptFile);
    return Promise.reject(new Error('PowerShell script not found'));
  }

  // Do NOT wrap scriptFile in quotes; execFile handles paths with spaces
  const psArgs = ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptFile, ...args.map(String)];

  console.log('Running PowerShell command:', 'powershell.exe', psArgs.join(' '));

  return new Promise((resolve, reject) => {
    execFile('powershell.exe', psArgs, { windowsHide: true }, (err, stdout, stderr) => {
      if (err) {
        console.error('PowerShell error:', stderr || err);
        reject(err);
      } else {
        resolve(stdout);
      }
    });
  });
}

// ---------------------
// Create BrowserWindow
// ---------------------
function createWindow() {
  const win = new BrowserWindow({
    width: 420,
    height: 600,
    resizable: false,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

// ---------------------
// IPC Handlers
// ---------------------
const audioScript = path.join(__dirname, 'src/audio/audio.ps1');
const setVolumeScript = path.join(__dirname, 'src/audio/setVolume.ps1');
const toggleMuteScript = path.join(__dirname, 'src/audio/toggleMute.ps1');

// Get audio sessions
ipcMain.handle('audio:getSessions', async () => {
  try {
    const output = await runPS(audioScript);
    console.log('Raw PowerShell output:', output); // <-- add this

    if (!output) return [];
    try {
      return JSON.parse(output);
    } catch (jsonErr) {
      console.error('Failed to parse JSON:', jsonErr, 'Output:', output);
      return [];
    }
  } catch (err) {
    console.error('Failed to get audio sessions:', err);
    return [];
  }
});


// Set volume
ipcMain.handle('audio:setVolume', async (_, pid, level) => {
  try {
    await runPS(setVolumeScript, pid, level);
    return true;
  } catch (err) {
    console.error('Failed to set volume:', err);
    return false;
  }
});

// Toggle mute
ipcMain.handle('audio:toggleMute', async (_, pid, mute) => {
  try {
    await runPS(toggleMuteScript, pid, mute ? 1 : 0);
    return true;
  } catch (err) {
    console.error('Failed to toggle mute:', err);
    return false;
  }
});

// Extract icon
ipcMain.handle('audio:getIcon', (_, exePath) => {
  try {
    const buffer = extractIcon(exePath, 32);
    return buffer.toString('base64');
  } catch {
    return null;
  }
});
