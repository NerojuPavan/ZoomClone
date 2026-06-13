from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.auth import UserLogin, UserRegister, UserResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(db)


@router.post("/register", response_model=UserResponse, status_code=201)
def register(
    payload: UserRegister,
    service: AuthService = Depends(get_auth_service),
) -> UserResponse:
    return service.register(payload)


@router.post("/login", response_model=UserResponse)
def login(
    payload: UserLogin,
    service: AuthService = Depends(get_auth_service),
) -> UserResponse:
    return service.login(payload)
