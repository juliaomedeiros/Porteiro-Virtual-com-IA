from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select
from src.api.deps import SessionDep, get_current_user
from src.core.security import verify_password, create_access_token
from src.models.usuario import Usuario, UsuarioRead

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login")
def login_access_token(
    session: SessionDep, form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = session.exec(select(Usuario).where(Usuario.email == form_data.username)).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    access_token = create_access_token(data={"sub": str(user.id)})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": str(user.id),
        "role": user.role
    }

@router.post("/test-token", response_model=UsuarioRead)
def test_token(current_user: Usuario = Depends(get_current_user)) -> Any:
    """
    Test access token
    """
    return current_user
