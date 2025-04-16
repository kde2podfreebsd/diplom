from llmAgents.api.router import (
    post_router,
    chat_router,
    investment_router,
    pools_router,
    user_address_router
)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

def create_app() -> FastAPI:
    app = FastAPI(
        title="DeFI Wizzard",
        description="API для анализа портфеля, анкетирования, новостей и чата с AI-агентом",
        version="1.0.0"
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(post_router.router)
    app.include_router(chat_router.router)
    app.include_router(investment_router.router)
    app.include_router(pools_router.router)
    app.include_router(user_address_router.router)

    return app

app = create_app()

if __name__ == "__main__":
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)