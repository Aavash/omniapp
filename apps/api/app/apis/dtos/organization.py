from pydantic import BaseModel, model_validator, ConfigDict, Field, EmailStr


class OrganizationCategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


class OrganizationCreateRequest(BaseModel):
    owner_name: str = Field(min_length=1, max_length=150)
    owner_email: EmailStr
    password: str = Field(min_length=1)
    confirm_password: str = Field(min_length=1)
    phone_number_ext: str = Field(max_length=5)
    phone_number: str = Field(min_length=10, max_length=15)
    organization_name: str = Field(min_length=1, max_length=255)
    org_address: str = Field(min_length=1, max_length=500)
    abbrebiation: str = Field(min_length=1, max_length=10)
    organization_category: int = Field(gt=0)

    @model_validator(mode="before")
    def check_passwords_match(cls, values):
        password = values.get("password")
        confirm_password = values.get("confirm_password")

        if password != confirm_password:
            raise ValueError("Password and confirm password must match.")

        return values


class OrganizationResponse(BaseModel):
    id: int
    name: str
    abbreviation: str
    address: str


class OwnerResponse(BaseModel):
    id: int
    email: str
    full_name: str


class OrganizationCreateResponse(BaseModel):
    organization: OrganizationResponse
    owner: OwnerResponse
