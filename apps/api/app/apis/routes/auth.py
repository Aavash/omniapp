from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.models import User
from app.apis.dtos.auth import ContactEmail, LoginUser
from app.apis.dtos.user import UserResponse
from app.config.database import get_db
from datetime import timedelta

from app.utils.email import send_html_email
from app.utils.email_template import prepare_contact_email
from app.utils.jwt import create_access_token, get_current_user
from app.apis.services.user import get_user_by_email

auth_router = APIRouter(prefix="/auth", tags=["auth"])


@auth_router.post("/login")
def login_user(payload: LoginUser, db: Session = Depends(get_db)):
    """
    Login user based on email and password
    """
    if not payload.email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email is required",
        )

    user = get_user_by_email(db, payload.email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.is_active:
        raise HTTPException(
            status_code=404, detail="Cannot Login. Please contact your organization."
        )
    tokenPayload = {"user_id": user.id, "email": user.email}
    token = create_access_token(tokenPayload, timedelta(days=30))

    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "organization_id": user.organization_id,
    }


@auth_router.get("/me", response_model=UserResponse)
async def read_users_me(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    return current_user


@auth_router.get("/email")
async def email_test():
    response = send_html_email(
        to="aavashkhatri95@gmail.com",
        subject="Test Plain Email",
        message="This is a plain text email",
    )

    return response


@auth_router.post("/contact")
def handle_contact(payload: ContactEmail):
    try:
        email_message = prepare_contact_email(payload)

        response = send_html_email(
            to="aavashkhatri95@gmail.com",
            subject="Test Plain Email",
            message=email_message,
        )
        return {"success": response}

    except Exception as e:
        print(e)
        return {"success": False}
