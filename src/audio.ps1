Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

[Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")]
public class MMDeviceEnumerator { }

public enum EDataFlow { eRender }
public enum ERole { eMultimedia }

[Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"),
 InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IMMDeviceEnumerator {
  int GetDefaultAudioEndpoint(EDataFlow dataFlow, ERole role, out IMMDevice device);
}

[Guid("D666063F-1587-4E43-81F1-B948E807363F"),
 InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IMMDevice {
  int Activate(ref Guid iid, int clsCtx, IntPtr activationParams, out object instance);
}

[Guid("77AA99A0-1BD6-484F-8BC7-2C654C9A9B6F"),
 InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IAudioSessionManager2 {
  int GetSessionEnumerator(out IAudioSessionEnumerator sessionEnum);
}

[Guid("E2F5BB11-0570-40CA-ACDD-3AA01277DEE8"),
 InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IAudioSessionEnumerator {
  int GetCount(out int count);
  int GetSession(int index, out IAudioSessionControl2 session);
}

[Guid("bfb7ff88-7239-4fc9-8fa2-07c950be9c6d"),
 InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IAudioSessionControl2 {
  int GetProcessId(out uint pid);
}

[Guid("87CE5498-68D6-44E5-9215-6DA47EF883D8"),
 InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface ISimpleAudioVolume {
  int SetMasterVolume(float level, Guid eventContext);
  int GetMasterVolume(out float level);
  int SetMute(bool mute, Guid eventContext);
  int GetMute(out bool mute);
}
"@

$enumerator = New-Object MMDeviceEnumerator
$deviceEnum = [IMMDeviceEnumerator]$enumerator
$deviceEnum.GetDefaultAudioEndpoint(0, 1, [ref]$device) | Out-Null

$iid = [Guid]"77AA99A0-1BD6-484F-8BC7-2C654C9A9B6F"
$device.Activate([ref]$iid, 23, [IntPtr]::Zero, [ref]$manager) | Out-Null

$manager.GetSessionEnumerator([ref]$sessions) | Out-Null
$sessions.GetCount([ref]$count) | Out-Null

$result = @()

for ($i = 0; $i -lt $count; $i++) {
  $sessions.GetSession($i, [ref]$control) | Out-Null
  $control.GetProcessId([ref]$pid) | Out-Null

  try {
    $proc = Get-Process -Id $pid -ErrorAction Stop
    $volume = [ISimpleAudioVolume]$control
    $volume.GetMasterVolume([ref]$level) | Out-Null
    $volume.GetMute([ref]$mute) | Out-Null

    $result += [PSCustomObject]@{
      name   = $proc.ProcessName
      exe    = $proc.Path
      pid    = $pid
      volume = [math]::Round($level * 100)
      muted  = $mute
    }
  } catch {}
}

$result | ConvertTo-Json -Depth 2
