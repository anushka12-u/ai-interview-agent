# AI Interview Agent

AI Interview Agent is a FastAPI + React application that runs technical interview simulations, adapts follow-up questions, and produces structured feedback for candidates.

## What’s Included

- `backend/` contains the FastAPI app, interview orchestration, prompt assembly, and feedback generation.
- `frontend/ai-interview-agent/` contains the Vite + React chat UI.
- `PROMPTS.md` is the canonical prompt registry used by the backend.

## Getting Started

Install dependencies for both halves of the app first:

```bash
pip install -r requirements.txt
cd frontend/ai-interview-agent
npm install
```

Run the backend from the repo root:

```bash
uvicorn backend.main:app --reload
```

Run the frontend in a second terminal:

```bash
cd frontend/ai-interview-agent
npm run dev
```

## Environment

The backend expects Gemini configuration from environment variables, not from the frontend:

```env
GEMINI_API_KEY=your_api_key
GEMINI_MODEL=gemini-3.6
```

## Project Notes

- Keep interview prompt changes in `PROMPTS.md` so they stay versioned with the app.
- The frontend talks to the backend API; do not put secrets in browser-exposed config.