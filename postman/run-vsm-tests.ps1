# Start WiseCub API if needed, then run the Virtual Stock Market Postman collection.
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $root "backend"
$python = Join-Path $backend ".venv\Scripts\python.exe"
$collection = Join-Path $PSScriptRoot "WiseCub-Virtual-Stock-Market.postman_collection.json"
$environment = Join-Path $PSScriptRoot "WiseCub-Local.postman_environment.json"
$postmanJs = Join-Path $env:APPDATA "npm\node_modules\postman-cli\bin\postman.js"
$base = "http://127.0.0.1:8000"

try {
    $health = Invoke-RestMethod -Uri "$base/health" -TimeoutSec 3
    Write-Host "API already up:" $health.status $health.database
} catch {
    Write-Host "Starting API on 8000..."
    Start-Process -FilePath $python -ArgumentList "-m","uvicorn","app.main:app","--host","127.0.0.1","--port","8000" -WorkingDirectory $backend -WindowStyle Minimized
    Start-Sleep -Seconds 4
}

if (-not (Test-Path $postmanJs)) {
    Write-Host "Postman CLI missing. Run: npm install -g postman-cli"
    exit 1
}

node $postmanJs collection run $collection -e $environment --no-report-events --timeout-request 30000
exit $LASTEXITCODE
