from pydantic import BaseModel, EmailStr, ConfigDict


class LoginUser(BaseModel):
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

    email: EmailStr
    password: str


class ContactEmail(BaseModel):
    email: EmailStr
    name: str
    message: str
