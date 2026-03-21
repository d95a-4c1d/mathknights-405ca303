# MathKnights Backend (FastAPI)

## Quick Start

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

## Project Structure

```
backend/
├── app/
│   ├── main.py           # FastAPI app + CORS + router mounting
│   ├── models/
│   │   └── schemas.py    # Pydantic models (shared with frontend types)
│   ├── routers/
│   │   ├── chapters.py   # /api/chapters — chapter & stage listing
│   │   ├── challenges.py # /api/challenge — answer submission
│   │   ├── missions.py   # /api/missions — daily/weekly tasks
│   │   ├── user.py       # /api/user — profile, exp, promotion
│   │   └── ocr.py        # /api/ocr — image upload & parsing
│   └── services/
│       └── (future)      # business logic, LLM integration, DB access
├── requirements.txt
└── README.md
```

## Endpoints

| Method | Path                    | Description                    |
|--------|-------------------------|--------------------------------|
| GET    | /api/health             | Health check                   |
| GET    | /api/chapters           | List all chapters              |
| GET    | /api/chapters/{id}      | Get chapter by ID              |
| POST   | /api/challenge          | Submit answer for evaluation   |
| GET    | /api/missions?type=     | List daily or weekly missions  |
| POST   | /api/missions/{id}/claim| Claim completed mission reward |
| GET    | /api/user/profile       | Get user profile               |
| POST   | /api/user/exp           | Use EXP cards                  |
| POST   | /api/user/promote       | Promote (elite upgrade)        |
| POST   | /api/ocr/analyze        | Upload image for OCR parsing   |

## TODO

- [ ] Integrate LLM for answer evaluation (challenges.py)
- [ ] Integrate OCR + vision model (ocr.py)
- [ ] Add database (SQLite → PostgreSQL)
- [ ] Add user authentication
- [ ] Wire frontend api.ts stubs to real endpoints
