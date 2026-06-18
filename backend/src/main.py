from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .api import webhooks, condominios, moradores, areas_comuns, documentos, analytics, encomendas

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set all origins to wildcard for development or specify frontend URLs
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(webhooks.router, prefix=settings.API_V1_STR)
app.include_router(condominios.router, prefix=settings.API_V1_STR)
app.include_router(moradores.router, prefix=settings.API_V1_STR)
app.include_router(areas_comuns.router, prefix=settings.API_V1_STR)
app.include_router(documentos.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(encomendas.router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {"message": "Porteiro Virtual IA API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
