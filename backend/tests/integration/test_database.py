import pytest
from sqlalchemy import create_engine, inspect, text
from sqlmodel import Session, select
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost:5433/porteiro_db")

def test_tables_exist():
    engine = create_engine(DATABASE_URL)
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    
    expected_tables = ["condominio", "morador", "areacomum", "documento", "reserva", "embedding", "interacao"]
    for table in expected_tables:
        assert table in tables, f"Table {table} missing"

def test_pgvector_extension():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        result = conn.execute(text("SELECT extname FROM pg_extension WHERE extname = 'vector';"))
        assert result.fetchone() is not None, "pgvector extension not installed"
