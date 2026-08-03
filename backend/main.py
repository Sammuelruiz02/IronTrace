from fastapi import FastAPI

app = FastAPI(
    title="IronTrace API",
    version="0.0.1"
)

@app.get("/")
async def root():
    return {
        "company": "IronTrace",
        "status": "Running",
        "message": "Welcome to the IronTrace API!"
    }