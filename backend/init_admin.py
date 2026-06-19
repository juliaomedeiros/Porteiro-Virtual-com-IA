import asyncio
from sqlmodel import Session, select
from src.core.database import engine
from src.models.usuario import Usuario
from src.core.security import get_password_hash

def init_admin():
    with Session(engine) as session:
        admin = session.exec(select(Usuario).where(Usuario.email == "admin@porteiro.com")).first()
        if not admin:
            admin = Usuario(
                name="Admin",
                email="admin@porteiro.com",
                hashed_password=get_password_hash("admin123"),
                role="ADMIN"
            )
            session.add(admin)
            session.commit()
            print("Admin user created: admin@porteiro.com / admin123")
        else:
            print("Admin user already exists")

if __name__ == "__main__":
    init_admin()
