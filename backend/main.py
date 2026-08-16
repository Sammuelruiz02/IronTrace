from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models, user_models
from app.auth_routes import router as auth_router
from app.database import Base, engine
from app.project_routes import router as projects_router
from app.routes import router as assets_router


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="IronTrace API",
    version="1.0.0",
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