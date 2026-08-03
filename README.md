# IronTrace

IronTrace is a construction asset intelligence platform for tracking equipment, GPS health, assignments, projects, maintenance, and operational alerts.

## Current prototype

The current frontend includes:

- Procore-inspired dashboard
- Asset search and filters
- Add and edit asset dialogs
- Asset details view
- Delete confirmation
- Browser persistence with `localStorage`
- Placeholder pages for upcoming GPS, projects, alerts, maintenance, reports, and settings modules

## Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open the local Vite URL shown in the terminal, usually `http://localhost:5173`.

## Run the backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

The backend API is available at `http://127.0.0.1:8000`, with documentation at `http://127.0.0.1:8000/docs`.

## Next milestone

Connect the Assets module to FastAPI and PostgreSQL so data is shared across users and devices instead of being stored only in the browser.
