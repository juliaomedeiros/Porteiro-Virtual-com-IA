from fastapi import FastAPI
from .core.config import settings
from .api import webhooks, condominios, moradores, areas_comuns, documentos, analytics

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

app.include_router(webhooks.router)
app.include_router(condominios.router)
app.include_router(moradores.router)
app.include_router(areas_comuns.router)
app.include_router(documentos.router)
app.include_router(analytics.router)

@app.get("/")
async def root():
    return {"message": "Porteiro Virtual IA API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
