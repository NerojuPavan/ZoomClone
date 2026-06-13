from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.user import User
from app.schemas.auth import UserLogin, UserRegister, UserResponse


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def register(self, payload: UserRegister) -> UserResponse:
        username = payload.username.strip()
        email = payload.email.strip().lower()

        existing_username = (
            self.db.query(User).filter(User.username == username).first()
        )
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username is already taken",
            )

        existing_email = self.db.query(User).filter(User.email == email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email is already registered",
            )

        user = User(
            username=username,
            email=email,
            password_hash=hash_password(payload.password),
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return UserResponse.model_validate(user)

    def login(self, payload: UserLogin) -> UserResponse:
        user = (
            self.db.query(User)
            .filter(User.username == payload.username.strip())
            .first()
        )
        if not user or not verify_password(payload.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password",
            )
        return UserResponse.model_validate(user)
