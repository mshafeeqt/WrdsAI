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
py -c "from app.rag_engine.engine import get_rag_engine; result = get_rag_engine().rebuild_index(); print(result.model_dump_json(indent=2))"
