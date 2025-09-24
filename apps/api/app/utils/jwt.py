from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import Depends, HTTPException, status

from fastapi.security import OAuth2PasswordBearer
from app.config.database import get_db
from app.config.env import settings
from app.apis.services.user import get_user_by_email
import jwt

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=30)
    data.update({"exp": expire})
    encoded_jwt = jwt.encode(
        data, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)], db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        email = payload.get("email")
        if email is None:
            raise credentials_exception
        user = get_user_by_email(db, email)
    except Exception:
        raise credentials_exception
    if user is None:
        raise credentials_exception
    return user
