# Sets up backend/venv with all dependencies, including the two-pass install
# resemblyzer needs on Windows (see requirements.txt for why).
# Run from the backend/ directory: ./scripts/install.ps1

py -3.12 -m venv venv
if (-not $?) { Write-Error "Failed to create venv. Is Python 3.12 installed? (py -3.12 --version)"; exit 1 }

./venv/Scripts/pip install --upgrade pip
./venv/Scripts/pip install webrtcvad-wheels==2.0.14
./venv/Scripts/pip install --no-deps -r requirements-diarization-nodeps.txt
./venv/Scripts/pip install -r requirements.txt

Write-Host "Done. Activate with: ./venv/Scripts/Activate.ps1"
