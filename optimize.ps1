
$SourceDir = ".\public\objects"
$OutputDir = ".\public\objects\optimized_lods"
$Assets = @(
    "valve.glb",
    "valve1.glb",
    "valve2.glb",
    "ball_valve.glb",
    "water_pipe_valve.glb",
    "industrial_table.glb",
    "optimized\road_grader.glb",
    "optimized\crane_machine.glb"
)

# Create Output Directory
if (!(Test-Path -Path $OutputDir)) {
    New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
    Write-Host "Created output directory: $OutputDir"
}

foreach ($File in $Assets) {
    $InputPath = Join-Path $SourceDir $File
    $Basename = [System.IO.Path]::GetFileNameWithoutExtension($File)
    
    if (Test-Path $InputPath) {
        Write-Host "Processing: $File" -ForegroundColor Cyan

        $OutHigh = Join-Path $OutputDir "$($Basename)_high.glb"
        $OutMed = Join-Path $OutputDir "$($Basename)_med.glb"
        $OutLow = Join-Path $OutputDir "$($Basename)_low.glb"

        # 1. HIGH: Draco Compression ONLY
        Write-Host "  - Generating High..." -NoNewline
        # Use npx to ensure we find the tool
        cmd /c "npx @gltf-transform/cli draco `"$InputPath`" `"$OutHigh`" --method edgebreaker" | Out-Null
        Write-Host " Done." -ForegroundColor Green

        # 2. MEDIUM: 50% Simplify + Draco
        Write-Host "  - Generating Medium..." -NoNewline
        cmd /c "npx @gltf-transform/cli simplify `"$InputPath`" `"$OutMed`" --ratio 0.5 --error 0.001" | Out-Null
        cmd /c "npx @gltf-transform/cli draco `"$OutMed`" `"$OutMed`" --method edgebreaker" | Out-Null
        Write-Host " Done." -ForegroundColor Green

        # 3. LOW: 10% Simplify + Draco
        Write-Host "  - Generating Low..." -NoNewline
        cmd /c "npx @gltf-transform/cli simplify `"$InputPath`" `"$OutLow`" --ratio 0.1 --error 0.01" | Out-Null
        cmd /c "npx @gltf-transform/cli draco `"$OutLow`" `"$OutLow`" --method edgebreaker" | Out-Null
        Write-Host " Done." -ForegroundColor Green
    } else {
        Write-Host "Warning: File not found: $InputPath" -ForegroundColor Yellow
    }
}

Write-Host "Optimization Complete!" -ForegroundColor Magenta
