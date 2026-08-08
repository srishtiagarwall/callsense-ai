FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt requirements-diarization-nodeps.txt ./

# Two-pass install: resemblyzer's own dependency list pins plain webrtcvad,
# which needs MSVC on Windows but ALSO needs a C compiler on slim Debian
# images (no build-essential here). webrtcvad-wheels first satisfies the
# import, so resemblyzer can be installed with --no-deps afterward.
#
# torch is pulled from PyPI's CPU-only wheel index — the default PyPI wheel
# bundles CUDA support we never use (no GPU in this deploy target), which
# roughly doubles both download size and image size for nothing.
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu \
    && grep -v '^torch==' requirements.txt > /tmp/requirements-no-torch.txt \
    && pip install --no-cache-dir -r /tmp/requirements-no-torch.txt \
    && pip install --no-cache-dir --no-deps -r requirements-diarization-nodeps.txt

COPY app ./app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
