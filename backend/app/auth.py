from fastapi import Header, HTTPException

from app.config import settings


def require_api_key(x_api_key: str | None = Header(None), key: str | None = None) -> None:
    """Gate a route behind settings.api_key, if one is configured.

    Checks the X-API-Key header first, falling back to a `key` query param —
    needed because EventSource (used for SSE job-status streaming) cannot
    send custom headers, so that endpoint can only authenticate via the URL.
    No-ops entirely when settings.api_key is unset (local dev default).
    """
    if not settings.api_key:
        return
    if x_api_key == settings.api_key or key == settings.api_key:
        return
    raise HTTPException(status_code=401, detail="Missing or invalid API key")
