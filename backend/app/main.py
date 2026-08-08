from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth import require_api_key
from app.config import settings
from app.routers import analytics, calls, evaluation, rubrics, search, sentiment, trackers, transcription

app = FastAPI(title="CallSense AI", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.frontend_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


_auth = [Depends(require_api_key)]

app.include_router(calls.router, dependencies=_auth)
app.include_router(transcription.router, dependencies=_auth)
app.include_router(evaluation.router, dependencies=_auth)
app.include_router(rubrics.router, dependencies=_auth)
app.include_router(sentiment.router, dependencies=_auth)
app.include_router(trackers.router, dependencies=_auth)
app.include_router(search.router, dependencies=_auth)
app.include_router(analytics.router, dependencies=_auth)
