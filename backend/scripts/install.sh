#!/usr/bin/env bash
# Sets up backend/venv with all dependencies, including the two-pass install
# resemblyzer needs (see requirements.txt for why).
# Run from the backend/ directory: ./scripts/install.sh
set -euo pipefail

python3.12 -m venv venv
./venv/bin/pip install --upgrade pip
./venv/bin/pip install webrtcvad-wheels==2.0.14
./venv/bin/pip install --no-deps -r requirements-diarization-nodeps.txt
./venv/bin/pip install -r requirements.txt

echo "Done. Activate with: source venv/bin/activate"
