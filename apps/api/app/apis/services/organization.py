from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.apis.dtos.organization import OrganizationCreateRequest
from app.models.organization import Organization
from app.models.user import User
from app.utils.password import get_password_hash


def check_organization_exists(db: Session, organization_id: int):
    return db.query(Organization).filter((Organization.id == organization_id)).first()


def create_organization_service(create_data: OrganizationCreateRequest, db: Session):
    try:
        # Create the Organization instance and add it to the session
        organization = Organization(
            name=create_data.organization_name,
            abbreviation=create_data.abbrebiation,
            address=create_data.org_address,
            category=create_data.organization_category,
        )
        db.add(organization)
        db.flush()  # Flush to generate organization.id

        # Create the Owner (User) instance, using the generated organization.id
        owner = User(
            full_name=create_data.owner_name,
            email=create_data.owner_email,
            phone_number_ext=create_data.phone_number_ext,
            phone_number=create_data.phone_number,
            organization_id=organization.id,
            password_hash=get_password_hash(create_data.password),
            pay_type="MONTHLY",
            payrate=0.0,
            address=create_data.org_address,
            is_owner=True,
        )
        db.add(owner)
        db.flush()  # Flush to make the owner persistent and generate its id

        db.refresh(owner)  # Refresh the owner instance after flushing/committing

        return organization, owner

    except Exception as e:
        print(e)
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to create organization at the moment. Please try again later",
        )
