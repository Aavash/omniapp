from passlib.context import CryptContext

from app.models.user import User

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


# def verify_password(plain_password, hashed_password):
#     return pwd_context.verify(plain_password, hashed_password)


# def get_password_hash(password):
#     return pwd_context.hash(password)


def get_password_hash(password: str) -> bytes:
    return pwd_context.hash(password).encode("utf-8")


def verify_password(plain_password: str, hashed_password: bytes) -> bool:
    return pwd_context.verify(plain_password, hashed_password.decode("utf-8"))


def authenticate_user(user: User, password: str):
    if not user or not verify_password(password, user.password_hash):
        return False
    return True
