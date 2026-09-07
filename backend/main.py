from contextlib import asynccontextmanager

from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth_routes import router as auth_router
from app.database import SessionLocal
from app.device_routes import router as devices_router
from app.notification_routes import (
    router as notifications_router,
)
from app.project_routes import router as projects_router
from app.routes import (
    check_for_offline_tracker_devices,
    router as assets_router,
)


scheduler = BackgroundScheduler()


def run_offline_tracker_check() -> None:
    database = SessionLocal()

    try:
        organization_ids = [
            row[0]
            for row in (
                database.query(
                    __import__(
                        "app.user_models",
                        fromlist=["Organization"],
                    ).Organization.id
                )
                .all()
            )
        ]

        for organization_id in organization_ids:
            check_for_offline_tracker_devices(
                database=database,
                organization_id=organization_id,
                offline_after_minutes=15,
            )

        database.commit()

    except Exception:
        database.rollback()
        raise

    finally:
        database.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.add_job(
        run_offline_tracker_check,
        trigger="interval",
        minutes=5,
        id="offline-tracker-check",
        replace_existing=True,
    )

    scheduler.start()

    try:
        yield
    finally:
        scheduler.shutdown(wait=False)


app = FastAPI(
    title="IronTrace API",
    version="1.0.0",
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(assets_router)
app.include_router(projects_router)
app.include_router(devices_router)
app.include_router(notifications_router)


@app.get("/")
def root():
    return {
        "name": "IronTrace API",
        "status": "running",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
    }