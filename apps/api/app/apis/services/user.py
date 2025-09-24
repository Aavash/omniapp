from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy import or_
from app.apis.dtos.user import EditUserSchema, UserCreateSchema
from app.models import User
from app.utils.password import get_password_hash
from sqlalchemy.orm import Session


def get_user_by_email(db: Session, email: str) -> User | None:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    return user


def get_user_by_id(db: Session, user_id: int) -> User | None:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    return user


def check_user_exists(db: Session, email: str, phone_number: str):
    return (
        db.query(User)
        .filter((User.email == email) | (User.phone_number == phone_number))
        .first()
    )


def create_user(db: Session, user_data: UserCreateSchema, organization_id: int) -> User:
    # Create a new User instance and add to the DB
    new_user = User(
        full_name=user_data.full_name,
        email=user_data.email,
        phone_number=user_data.phone_number,
        phone_number_ext=user_data.phone_number_ext,
        address=user_data.address,
        password_hash=get_password_hash(user_data.password),
        pay_type=user_data.pay_type,
        payrate=user_data.payrate,
        organization_id=organization_id,
        is_owner=False,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


def check_user_conflicts(db: Session, user_data: EditUserSchema) -> User:
    return (
        db.query(User)
        .filter(
            (User.email == user_data.email)
            | (User.phone_number == user_data.phone_number),
            User.id != user_data.id,
        )
        .first()
    )


def edit_user(db: Session, user_data: EditUserSchema, existing_user: User) -> User:
    existing_user.full_name = user_data.full_name
    existing_user.email = user_data.email
    existing_user.phone_number = user_data.phone_number
    existing_user.phone_number_ext = user_data.phone_number_ext
    existing_user.address = user_data.address
    if user_data.password:
        existing_user.password_hash = get_password_hash(user_data.password)
    existing_user.pay_type = user_data.pay_type
    existing_user.payrate = user_data.payrate

    db.commit()
    db.refresh(existing_user)
    return existing_user


def list_user(
    db: Session,
    organization_id: int,
    page: int = 1,
    per_page: int = 10,
    search_query: Optional[str] = None,
    sort_by: Optional[str] = "id",
    sort_order: Optional[str] = "asc",
):
    query = db.query(User).filter(User.organization_id == organization_id)

    if search_query:
        query = query.filter(
            or_(
                User.full_name.ilike(f"%{search_query}%"),
                User.email.ilike(f"%{search_query}%"),
            )
        )

    if sort_by and hasattr(User, sort_by):
        column = getattr(User, sort_by)
        if sort_order == "desc":
            query = query.order_by(column.desc())
        else:
            query = query.order_by(column.asc())
    else:
        query = query.order_by(User.id.asc())

    users = query.offset((page - 1) * per_page).limit(per_page).all()

    return users


def delete_user(db: Session, employee: User):
    db.delete(employee)
    db.commit()
