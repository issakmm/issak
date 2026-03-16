# NearbyTalk

Anonymous local social feed for your city and university. Post, vote, and comment — no username attached.

## What it does

- Post anonymously to your **city feed** or **university feed**
- Upvote / downvote posts and comments
- University feed is only available to `.edu` email holders
- Minimal dark neo-brutalist UI

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, Tailwind CSS, Radix UI |
| Backend | FastAPI (Python), MongoDB |
| Auth | JWT + email verification |

## Run it locally

**Prerequisites**
- Docker Desktop installed and running
- Python 3.9+
- `nvm` installed
- Node.js 18

## Manual local setup

1. Clone the repo and move into it.

```bash
git clone <repo-url>
cd <repo-folder>
```

2. Start MongoDB with Docker.

```bash
docker run --rm --name nearbytalk-mongo -p 27017:27017 -d mongo:7
```

3. Create and activate a Python virtual environment.

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
```

4. Install backend dependencies.

```bash
pip install fastapi uvicorn motor pymongo "pydantic[email]" python-dotenv PyJWT python-multipart
```

5. Create `backend/.env`.

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=nearbytalk
JWT_SECRET=dev-only-secret
CORS_ORIGINS=http://localhost:3000
```

6. Start the backend.

```bash
cd backend
../.venv/bin/python -m uvicorn server:app --host 127.0.0.1 --port 8001 --reload
```

7. In a new terminal, load Node with `nvm` and install frontend dependencies.

```bash
source ~/.nvm/nvm.sh
nvm install 18
nvm use 18

cd frontend
echo 'REACT_APP_BACKEND_URL=http://localhost:8001' > .env
npm install -g yarn@1.22.22
yarn install
```

8. Start the frontend.

```bash
cd frontend
yarn start
```

9. Open the app.

- Frontend: `http://localhost:3000`
- Backend health check: `http://localhost:8001/api/health`

## Stopping local services

- Stop the frontend and backend with `Ctrl+C` in each terminal
- Stop MongoDB with `docker stop nearbytalk-mongo`

## Project structure

```
├── backend/
│   └── server.py       # All API routes (FastAPI)
├── frontend/
│   └── src/
│       ├── App.js              # Auth context + routing
│       └── pages/
│           ├── LandingPage.jsx     # Login / register
│           ├── FeedPage.jsx        # Main feed
│           └── PostDetailPage.jsx  # Single post + comments
└── memory/PRD.md       # Product requirements doc
```

## Environment variables

**`backend/.env`**
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=nearbytalk
JWT_SECRET=dev-only-secret
CORS_ORIGINS=http://localhost:3000
```

**`frontend/.env`**
```
REACT_APP_BACKEND_URL=http://localhost:8001
```
