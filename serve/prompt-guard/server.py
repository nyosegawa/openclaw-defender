"""
FastAPI inference server for Meta Prompt Guard 2.

Serves the 86M (default) or 22M variant via a simple JSON API.

Environment variables:
    HOST        Listen address (default: 0.0.0.0)
    PORT        Listen port    (default: 8000)
    MODEL_SIZE  "86m" or "22m" (default: 86m)
    DEVICE      "auto", "cpu", or "cuda" (default: auto)
"""

from __future__ import annotations

import logging
import os
import time
from contextlib import asynccontextmanager
from typing import Optional

import torch
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import AutoModelForSequenceClassification, AutoTokenizer

# ── Configuration ─────────────────────────────────────────────────

HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
MODEL_SIZE = os.getenv("MODEL_SIZE", "86m").lower()
DEVICE_ENV = os.getenv("DEVICE", "auto").lower()

MODEL_MAP = {
    "86m": "meta-llama/Prompt-Guard-2-86M",
    "22m": "meta-llama/Prompt-Guard-2-22M",
}

LABEL_MAP = {0: "benign", 1: "injection", 2: "jailbreak"}

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("prompt-guard-server")

# ── Global model state ────────────────────────────────────────────

tokenizer = None
model = None
device = None


def resolve_device() -> torch.device:
    if DEVICE_ENV == "cuda":
        return torch.device("cuda")
    if DEVICE_ENV == "cpu":
        return torch.device("cpu")
    # auto
    if torch.cuda.is_available():
        return torch.device("cuda")
    return torch.device("cpu")


def load_model():
    global tokenizer, model, device

    model_name = MODEL_MAP.get(MODEL_SIZE)
    if model_name is None:
        raise ValueError(f"Unknown MODEL_SIZE={MODEL_SIZE!r}. Use '86m' or '22m'.")

    device = resolve_device()

    logger.info("Loading model %s on device %s ...", model_name, device)
    t0 = time.perf_counter()

    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForSequenceClassification.from_pretrained(model_name)
    model.to(device)  # type: ignore[union-attr]
    model.eval()

    elapsed = time.perf_counter() - t0
    logger.info("Model loaded in %.2f s", elapsed)


# ── Request / Response schemas ────────────────────────────────────


class ClassifyRequest(BaseModel):
    text: Optional[str] = None
    texts: Optional[list[str]] = None


class ClassifyResult(BaseModel):
    label: str
    confidence: float
    scores: dict[str, float]


class ClassifyResponse(BaseModel):
    label: Optional[str] = None
    confidence: Optional[float] = None
    scores: Optional[dict[str, float]] = None
    results: Optional[list[ClassifyResult]] = None


class HealthResponse(BaseModel):
    status: str
    model: str
    device: str


# ── Inference helper ──────────────────────────────────────────────


def classify_texts(texts: list[str]) -> list[ClassifyResult]:
    t0 = time.perf_counter()

    inputs = tokenizer(  # type: ignore[misc]
        texts,
        return_tensors="pt",
        padding=True,
        truncation=True,
        max_length=512,
    ).to(device)

    with torch.no_grad():
        logits = model(**inputs).logits  # type: ignore[misc]

    probs = torch.softmax(logits, dim=-1)

    results: list[ClassifyResult] = []
    for i in range(len(texts)):
        scores_dict = {LABEL_MAP[j]: round(probs[i][j].item(), 6) for j in LABEL_MAP}
        predicted_idx = int(torch.argmax(probs[i]).item())
        results.append(
            ClassifyResult(
                label=LABEL_MAP[predicted_idx],
                confidence=round(probs[i][predicted_idx].item(), 6),
                scores=scores_dict,
            )
        )

    elapsed_ms = (time.perf_counter() - t0) * 1000
    logger.info(
        "Classified %d text(s) in %.1f ms", len(texts), elapsed_ms
    )

    return results


# ── FastAPI app ───────────────────────────────────────────────────


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_model()
    yield


app = FastAPI(
    title="Prompt Guard 2 Inference Server",
    version="1.0.0",
    lifespan=lifespan,
)


@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(
        status="ok",
        model=MODEL_MAP.get(MODEL_SIZE, "unknown"),
        device=str(device),
    )


@app.post("/classify", response_model=ClassifyResponse)
async def classify(req: ClassifyRequest):
    # Single text
    if req.text is not None:
        results = classify_texts([req.text])
        r = results[0]
        return ClassifyResponse(
            label=r.label,
            confidence=r.confidence,
            scores=r.scores,
        )

    # Batch
    if req.texts is not None:
        if len(req.texts) == 0:
            raise HTTPException(status_code=400, detail="texts array must not be empty")
        if len(req.texts) > 128:
            raise HTTPException(
                status_code=400, detail="Batch size limited to 128 texts"
            )
        results = classify_texts(req.texts)
        return ClassifyResponse(results=results)

    raise HTTPException(
        status_code=400,
        detail='Request must include "text" (string) or "texts" (array of strings)',
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=HOST, port=PORT)
