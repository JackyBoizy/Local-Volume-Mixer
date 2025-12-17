// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const extractIcon = require('extract-file-icon');

function runPS(scriptFile, ...args) {
  if (!fs.existsSync(scriptFile)) {
    console.error('PowerShell script not found:', scriptFile);
    return Promise.reject(new Error('PowerShell script not found: ' + scriptFile));
  }

  // execFile expects args as array; pass raw scriptFile (no extra quoting)
  const psArgs = ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptFile, ...args.map(String)];
  console.log('Running PowerShell:', 'powershell.exe', psArgs.join(' '));

  return new Promise((resolve, reject) => {
    execFile('powershell.exe', psArgs, { windowsHide: true, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        console.error('PowerShell error:', stderr || err);
        reject(new Error(stderr || err.message));
      } else {
        resolve((stdout || '').trim());
      }
    });
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 520,
    height: 700,
    resizable: true,
    frame: false, // hides default menu bar
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

// scripts paths (update if you keep a different layout)
const base = path.join(__dirname, 'src', 'audio');
const audioScript = path.join(base, 'audio.ps1');
const setVolumeScript = path.join(base, 'setVolume.ps1');
const toggleMuteScript = path.join(base, 'toggleMute.ps1');

// IPC: list sessions
ipcMain.handle('audio:getSessions', async () => {
  try {
    const out = await runPS(audioScript);
    if (!out) return [];
    try {
      return JSON.parse(out);
    } catch (parseErr) {
      console.error('JSON parse failed for audio:getSessions:', parseErr, 'raw:', out);
      return [];
    }
  } catch (err) {
    console.error('audio:getSessions failed:', err);
    return [];
  }
});

// IPC: set volume (delegates to setVolume.ps1)
ipcMain.handle('audio:setVolume', async (_, pid, level) => {
  try {
    const out = await runPS(setVolumeScript, pid, level);
    if (!out) return { ok: true };
    try { return JSON.parse(out); } catch { return { ok: true }; }
  } catch (err) {
    console.error('audio:setVolume failed:', err);
    return { ok: false, error: String(err) };
  }
});

// IPC: toggle mute (delegates to toggleMute.ps1)
ipcMain.handle('audio:toggleMute', async (_, pid, mute) => {
  try {
    const out = await runPS(toggleMuteScript, pid, mute ? 1 : 0);
    if (!out) return { ok: true };
    try { return JSON.parse(out); } catch { return { ok: true }; }
  } catch (err) {
    console.error('audio:toggleMute failed:', err);
    return { ok: false, error: String(err) };
  }
});

// IPC: get icon (returns base64 PNG or null)
ipcMain.handle('audio:getIcon', (_, exePath) => {
  try {
    if (!exePath || typeof exePath !== 'string') return null;
    const buffer = extractIcon(exePath, 32); // may throw for UWP apps
    return buffer ? buffer.toString('base64') : null;
  } catch (err) {
    console.warn('extract icon failed:', exePath, err && err.message);
    return null;
  }
});
