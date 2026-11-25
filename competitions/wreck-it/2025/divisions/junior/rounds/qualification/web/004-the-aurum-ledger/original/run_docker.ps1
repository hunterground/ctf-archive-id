# Build and run The Aurum Ledger container on Windows PowerShell
param(
  [string]$ImageName = "the_aurum_ledger",
  [int]$Port = 1337
)

Write-Host "[Build] Building Docker image: $ImageName" -ForegroundColor Yellow

docker build -t $ImageName .

Write-Host "[Run] Stopping existing container (if any)" -ForegroundColor Yellow

docker rm -f $ImageName 2>$null | Out-Null

Write-Host "[Run] Starting container: $ImageName on port $Port" -ForegroundColor Yellow

# Use quoted interpolation for port mapping so PowerShell expands $Port correctly
docker run --name=$ImageName --rm -p "${Port}:1337" -it $ImageName
