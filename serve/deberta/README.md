# DeBERTa v3 Prompt Injection Server

FastAPI server that serves ProtectAI DeBERTa v3 base prompt-injection-v2 for binary prompt injection classification.

## Quick Start

### Docker

```bash
docker build -t deberta-server .
docker run -p 8001:8001 deberta-server
```

### Local Python

```bash
pip install -r requirements.txt
python server.py
```

## Environment Variables

| Variable | Default    | Description                           |
|----------|-----------|---------------------------------------|
| `HOST`   | `0.0.0.0` | Listen address                        |
| `PORT`   | `8001`    | Listen port                           |
| `DEVICE` | `auto`    | Compute device: `auto`, `cpu`, `cuda` |

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
  "confidence": 0.97,
  "scores": { "benign": 0.03, "injection": 0.97 }
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
    { "label": "benign", "confidence": 0.99, "scores": { ... } },
    { "label": "injection", "confidence": 0.96, "scores": { ... } }
  ]
}
```

### `GET /health`

```json
{ "status": "ok", "model": "ProtectAI/deberta-v3-base-prompt-injection-v2", "device": "cpu" }
```
