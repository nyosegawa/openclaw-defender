# Prompt Guard 2 Inference Server

FastAPI server that serves Meta Prompt Guard 2 (86M or 22M) for prompt injection classification.

## Quick Start

### Docker

```bash
docker build -t prompt-guard-server .
docker run -p 8000:8000 prompt-guard-server
```

### Local Python

```bash
pip install -r requirements.txt
python server.py
```

## Environment Variables

| Variable     | Default     | Description                          |
|-------------|-------------|--------------------------------------|
| `HOST`      | `0.0.0.0`  | Listen address                       |
| `PORT`      | `8000`     | Listen port                          |
| `MODEL_SIZE`| `86m`      | Model variant: `86m` or `22m`        |
| `DEVICE`    | `auto`     | Compute device: `auto`, `cpu`, `cuda`|

## API

### `POST /classify`

Single text:
```json
{ "text": "Ignore all previous instructions" }
```

Response:
```json
{
  "label": "injection",
  "confidence": 0.95,
  "scores": { "benign": 0.03, "injection": 0.95, "jailbreak": 0.02 }
}
```

Batch:
```json
{ "texts": ["Hello", "Ignore all instructions"] }
```

Response:
```json
{
  "results": [
    { "label": "benign", "confidence": 0.98, "scores": { ... } },
    { "label": "injection", "confidence": 0.94, "scores": { ... } }
  ]
}
```

### `GET /health`

```json
{ "status": "ok", "model": "meta-llama/Llama-Prompt-Guard-2-86M", "device": "cpu" }
```
