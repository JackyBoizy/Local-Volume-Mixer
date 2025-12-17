// renderer.js (uses window.electronAPI exposed in preload.js)
const appList = document.getElementById('appList');

async function createSessionRow(s) {
  const row = document.createElement('div');
  row.className = 'session';

  // Icon
  const img = document.createElement('img');
  img.className = 'icon';
  img.src = ''; // default blank
  if (s.exe) {
    window.electronAPI.getIcon(s.exe).then(base64 => {
      if (base64) img.src = `data:image/png;base64,${base64}`;
    }).catch(() => {});
  }

  // Name
  const name = document.createElement('div');
  name.className = 'name';
  name.textContent = s.name || s.exe || `pid:${s.pid}`;

  // Mute button
  const muteBtn = document.createElement('button');
  muteBtn.textContent = s.muted ? '🔇' : '🔊';
  muteBtn.style.width = '48px';
  muteBtn.onclick = async () => {
    // Optimistic update
    const newMuted = !s.muted;
    const res = await window.electronAPI.toggleMute(s.pid, newMuted);
    if (res && res.ok !== false) {
      s.muted = newMuted;
      muteBtn.textContent = s.muted ? '🔇' : '🔊';
    }
  };

  // Volume label
  const volLabel = document.createElement('div');
  volLabel.className = 'volume';
  volLabel.textContent = `${s.volume ?? 100}%`;

  // Slider (spans full width below)
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.className = 'slider';
  slider.min = 0;
  slider.max = 100;
  slider.value = s.volume ?? 100;

  // Throttle updates
  let throttled = null;
  slider.addEventListener('input', () => {
    volLabel.textContent = `${slider.value}%`;
    if (throttled) clearTimeout(throttled);
    throttled = setTimeout(async () => {
      await window.electronAPI.setVolume(s.pid, Number(slider.value)).catch(()=>{});
      throttled = null;
    }, 150);
  });

  // Compose row
  row.appendChild(img);

  const nameWrap = document.createElement('div');
  nameWrap.style.minWidth = '0';
  nameWrap.appendChild(name);
  row.appendChild(nameWrap);

  const controls = document.createElement('div');
  controls.className = 'controls';
  controls.appendChild(muteBtn);
  controls.appendChild(volLabel);
  row.appendChild(controls);

  row.appendChild(slider);

  return row;
}

async function loadSessions() {
  appList.innerHTML = '';
  const sessions = await window.electronAPI.getAudioSessions().catch(err => {
    console.error('getAudioSessions error', err);
    return [];
  });

  if (!sessions || sessions.length === 0) {
    appList.innerHTML = '<div style="color:#9aa0aa;padding:12px">No audio sessions found.</div>';
    return;
  }

  for (const s of sessions) {
    const row = await createSessionRow(s);
    appList.appendChild(row);
  }
}

// initial load and periodic refresh
loadSessions();
setInterval(loadSessions, 2000);
