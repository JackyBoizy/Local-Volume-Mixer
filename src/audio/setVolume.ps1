param(
  [int]$procId,
  [int]$level
)

# Validate
if (-not $procId -or -not $level) {
  @{ ok = $false; error = "missing-args" } | ConvertTo-Json -Compress
  exit 0
}

# (Placeholder) -- real audio control would go here
# Return status
@{ ok = $true; pid = $procId; volume = [math]::Min(100, [math]::Max(0, $level)) } | ConvertTo-Json -Compress
