const container = document.getElementById('sessions-container');

// Fetch sessions and render them
async function loadSessions() {
  container.innerHTML = '';
  const sessions = await window.electronAPI.getAudioSessions();

  sessions.forEach(async (session) => {
    const div = document.createElement('div');
    div.className = 'session';

    // App icon
    let iconSrc = '';
    if (session.exe) {
      const iconBase64 = await window.electronAPI.getIcon(session.exe);
      if (iconBase64) iconSrc = `data:image/png;base64,${iconBase64}`;
    }
    const img = document.createElement('img');
    img.src = iconSrc || '';
    div.appendChild(img);

    // Info
    const info = document.createElement('div');
    info.className = 'session-info';
    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = session.name;
    info.appendChild(name);
    div.appendChild(info);

    // Controls
    const controls = document.createElement('div');
    controls.className = 'session-controls';

    // Volume slider
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = 0;
    slider.max = 100;
    slider.value = session.volume;
    slider.addEventListener('input', async () => {
      await window.electronAPI.setVolume(session.pid, slider.value);
    });
    controls.appendChild(slider);

    // Mute button
    const muteBtn = document.createElement('button');
    muteBtn.textContent = session.muted ? 'Unmute' : 'Mute';
    muteBtn.addEventListener('click', async () => {
      const success = await window.electronAPI.toggleMute(session.pid, !session.muted);
      if (success) {
        session.muted = !session.muted;
        muteBtn.textContent = session.muted ? 'Unmute' : 'Mute';
      }
    });
    controls.appendChild(muteBtn);

    div.appendChild(controls);
    container.appendChild(div);
  });
}

// Auto-refresh every 2 seconds
loadSessions();
setInterval(loadSessions, 2000);
