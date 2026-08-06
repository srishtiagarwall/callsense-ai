# CallSense AI

An asynchronous call-intelligence platform: upload a call recording, transcribe it through a
provider-independent fallback chain, diarize speakers, score it against a configurable QA/compliance
rubric with an LLM, and view results on a dashboard.

This is a personal/portfolio rebuild of the architecture pattern behind an enterprise call-intelligence
system — reimplemented from scratch, seeded with a public dataset. No employer code, prompts, or data
are used.

## Stack

- **Backend**: FastAPI, Python 3.12
- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS
- **Storage**: local JSON files + local filesystem for audio (no database yet — swappable later)
- **Transcription providers**: OpenAI Whisper, OpenAI GPT-4o Transcribe, Smallest.ai Pulse, Sarvam Saaras v3
  — provider-independent interface with retry/fallback chain, gracefully skips unconfigured providers
- **Evaluation**: Gemini 2.5 Flash scoring transcripts against a configurable rubric

## Project layout

```
backend/    FastAPI app — ingestion, transcription router, diarization, evaluation, analytics
frontend/   Next.js dashboard — upload, call list, call detail, KPI/trend dashboard
```

## Running locally

### Backend

```bash
cd backend
python -m venv venv
./venv/Scripts/pip install -r requirements.txt   # or venv/bin/pip on macOS/Linux
cp .env.example .env   # fill in whichever provider keys you have
./venv/Scripts/python -m uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend expects the backend at `http://localhost:8000` by default (see `frontend/.env.local`,
`NEXT_PUBLIC_API_BASE_URL`).

## Seeding demo data

`backend/scripts/seed_demo_data.py` seeds calls from the Kaggle
[Call Center Transcripts Dataset](https://www.kaggle.com/datasets/oleksiymaliovanyy/call-center-transcripts-dataset)
(MIT licensed) — download it into `../data_raw` first, then run the script. `evaluate_seeded_calls.py`
runs evaluation over any seeded calls that don't have one yet (requires `GEMINI_API_KEY`).

## Notes

- All 4 transcription providers require their own paid API key (each offers free signup credits) —
  the fallback router skips any provider with no key configured, so the app runs fine with zero keys set.
- No auth on the dashboard — single-user local tool.
