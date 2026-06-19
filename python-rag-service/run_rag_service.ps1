$ErrorActionPreference = "Stop"

$serviceRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$packagesPath = Join-Path $serviceRoot ".packages"

if (-not (Test-Path $packagesPath)) {
  Write-Error "Python dependencies are not installed. Install them into .packages first."
}

$env:PYTHONPATH = $packagesPath
$env:PYTHONUTF8 = "1"
$env:PYTHONIOENCODING = "utf-8"
Remove-Item Env:HTTP_PROXY,Env:HTTPS_PROXY,Env:ALL_PROXY -ErrorAction SilentlyContinue

Set-Location $serviceRoot
py -m uvicorn main:app --host 0.0.0.0 --port 8001
