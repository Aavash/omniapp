from fastapi import FastAPI
from app.apis.routes import router
from fastapi.middleware.cors import CORSMiddleware
from app.config.env import settings


app = FastAPI()



app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
