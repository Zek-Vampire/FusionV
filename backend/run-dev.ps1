# Loads .env into environment variables, then starts the backend (Windows PowerShell).
if (-not (Test-Path ".env")) { Write-Host "Create .env first (copy .env.example)"; exit 1 }
Get-Content .env | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
        $name, $value = $line.Split("=", 2)
        [System.Environment]::SetEnvironmentVariable($name.Trim(), $value.Trim(), "Process")
    }
}
mvn spring-boot:run
