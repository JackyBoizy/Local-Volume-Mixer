# audio.ps1 - Return list of GUI processes
$sessions = @()

# Only include processes with a window (MainWindowHandle != 0)
Get-Process | Where-Object { $_.MainWindowHandle -ne 0 } | ForEach-Object {
    try {
        $p = $_
        # Safe exe path check
        if ($p.Path) {
            $exePath = $p.Path
        } else {
            $exePath = ""
        }

        $sessions += [PSCustomObject]@{
            name   = $p.ProcessName
            exe    = $exePath
            pid    = $p.Id
            volume = 100       # placeholder value
            muted  = $false    # placeholder
        }
    } catch {
        # ignore inaccessible processes
    }
}

# Output JSON
$sessions | ConvertTo-Json -Compress -Depth 2
