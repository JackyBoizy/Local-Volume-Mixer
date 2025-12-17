param(
  [int]$procId,
  [int]$mute
)

if (-not $procId) {
  @{ ok = $false; error = "missing-pid" } | ConvertTo-Json -Compress
  exit 0
}

$muted = $false
if ($mute -eq 1) { $muted = $true }

# (Placeholder) -- real mute control would go here
@{ ok = $true; pid = $procId; muted = $muted } | ConvertTo-Json -Compress
