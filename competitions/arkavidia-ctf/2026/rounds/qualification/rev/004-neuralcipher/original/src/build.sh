#!/bin/bash
set -e

# Directory setup
BASE_DIR=$(dirname "$(realpath "$0")")
DIST_DIR="$BASE_DIR/../dist"
SRC_DIR="$BASE_DIR"

echo "[*] Building NeuralCipher Challenge..."

# 1. Clean dist folder (optional, but good for reproducibility)
# rm -f "$DIST_DIR/output" "$DIST_DIR/weights" "$DIST_DIR/chall.pyc" "$DIST_DIR/dist.zip"

# 2. Generate challenge files (output, weights)
echo "[*] Generating output and weights..."
cd "$SRC_DIR"
python3 challenge_gen.py
# (challenge_gen.py now outputs to ../dist/output and ../dist/weights with no extension)

# 3. Create pyc from obfuscated.py
echo "[*] Compiling obfuscated.py..."
python3 -m py_compile obfuscated.py

# 4. Move and rename pyc to dist/chall.pyc
echo "[*] Moving pyc to dist/chall.pyc..."
# Find the generated pyc file in __pycache__
PYC_FILE=$(find __pycache__ -name "obfuscated.cpython-*.pyc" | head -n 1)
if [ -z "$PYC_FILE" ]; then
    echo "[!] Error: Could not find compiled pyc file"
    exit 1
fi
cp "$PYC_FILE" "$DIST_DIR/chall.pyc"

# 5. Corrupt the pyc file
echo "[*] Corrupting chall.pyc..."
python3 corrupt_pyc.py "$DIST_DIR/chall.pyc"

# 6. Create dist.zip
echo "[*] Creating dist.zip..."
cd "$DIST_DIR"
# Remove old zip if exists
rm -f dist.zip
# Zip the required files
zip dist.zip output weights chall.pyc README.txt

echo "[✓] Build complete! check dist/ folder."
ls -l "$DIST_DIR"
