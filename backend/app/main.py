from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.auth import router as auth_router
from app.api.routes.optimization import router as optimization_router
from app.core.config import settings


app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "Dynamic Programming Driven "
        "Software Pipeline Optimization Engine"
    ),
    version=settings.APP_VERSION,
)


allowed_origins = {
    settings.FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
}


app.add_middleware(
    CORSMiddleware,
    allow_origins=list(allowed_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(optimization_router)


@app.get("/")
def root():
    return {
        "message": "OptiFlow API is running.",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
    }