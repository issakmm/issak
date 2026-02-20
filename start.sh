#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "========================================"
echo "       NearbyTalk - Setup & Start"
echo "========================================"

# ── 1. Python deps ─────────────────────────
echo ""
echo "→ Installing Python dependencies..."
pip3 install fastapi uvicorn motor pymongo "pydantic[email]" python-dotenv PyJWT python-multipart starlette
echo "✓ Python dependencies ready"

# ── 2. Node ────────────────────────────────
if ! command -v node &>/dev/null; then
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"
fi

if ! command -v node &>/dev/null; then
  echo ""
  echo "ERROR: Node.js is not installed."
  echo "Download it from: https://nodejs.org"
  exit 1
fi
echo "✓ Node $(node --version) found"

# ── 3. yarn ────────────────────────────────
if ! command -v yarn &>/dev/null; then
  echo "→ Installing yarn..."
  npm install -g yarn --silent
fi
echo "✓ Yarn ready"

# ── 4. Frontend deps ───────────────────────
echo ""
echo "→ Installing frontend dependencies (this may take a minute)..."
cd frontend
yarn install
cd ..
echo "✓ Frontend dependencies ready"

# ── 5. MongoDB ─────────────────────────────
MONGO_DIR="$SCRIPT_DIR/.mongodb"
MONGO_DATA="$MONGO_DIR/data"
MONGO_BIN="$MONGO_DIR/bin/mongod"

if [ ! -f "$MONGO_BIN" ]; then
  echo ""
  echo "→ Downloading MongoDB (one-time, ~100MB)..."
  mkdir -p "$MONGO_DIR" "$MONGO_DATA"

  ARCH=$(uname -m)
  OS=$(uname -s)

  if [ "$OS" = "Darwin" ]; then
    if [ "$ARCH" = "arm64" ]; then
      MONGO_URL="https://fastdl.mongodb.org/osx/mongodb-macos-arm64-7.0.4.tgz"
    else
      MONGO_URL="https://fastdl.mongodb.org/osx/mongodb-macos-x86_64-7.0.4.tgz"
    fi
  else
    echo "ERROR: This script supports macOS only."
    exit 1
  fi

  curl -# -L "$MONGO_URL" | tar -xz -C "$MONGO_DIR" --strip-components=1
  echo "✓ MongoDB downloaded"
fi

# Start MongoDB if not already running
if ! pgrep -f "$MONGO_BIN" > /dev/null; then
  echo "→ Starting MongoDB..."
  "$MONGO_BIN" --dbpath "$MONGO_DATA" --port 27017 --fork \
    --logpath "$MONGO_DIR/mongod.log" --quiet
  sleep 2
fi
echo "✓ MongoDB running"

# ── 6. Env files ───────────────────────────
if [ ! -f backend/.env ]; then
  JWT_SECRET=$(python3 -c "import secrets; print(secrets.token_hex(32))")
  cat > backend/.env <<EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=nearbytalk
JWT_SECRET=$JWT_SECRET
EOF
  echo "✓ backend/.env created"
fi

if [ ! -f frontend/.env ]; then
  cat > frontend/.env <<EOF
REACT_APP_BACKEND_URL=http://localhost:8001
EOF
  echo "✓ frontend/.env created"
fi

# ── 7. Start servers ───────────────────────
echo ""
echo "========================================"
echo "  Backend  → http://localhost:8001"
echo "  Frontend → http://localhost:3000"
echo "  Press Ctrl+C to stop"
echo "========================================"
echo ""

cleanup() {
  echo ""
  echo "Shutting down..."
  kill $(jobs -p) 2>/dev/null
  "$MONGO_BIN" --dbpath "$MONGO_DATA" --shutdown 2>/dev/null || true
}
trap cleanup EXIT

cd backend
python3 -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload &
cd ..

sleep 2

cd frontend
yarn start &
cd ..

wait
