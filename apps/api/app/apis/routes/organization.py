from fastapi import APIRouter, Depends, HTTPException, status
from app.apis.services.organization import create_organization_service
from app.apis.services.user import check_user_exists
from app.config.database import get_db
from sqlalchemy.orm import Session
from app.apis.dtos.organization import (
    OrganizationCategoryResponse,
    OrganizationCreateRequest,
    OrganizationCreateResponse,
)
from app.models.organization import Organization
from app.utils.jwt import get_current_user
from app.models.user import User
from typing import Annotated
from app.models import OrganizationCategory
from typing import List


organization_router = APIRouter(prefix="/organization", tags=["organization"])


@organization_router.get(
    "/categories", response_model=List[OrganizationCategoryResponse]
)
async def list_organization_categories(db: Session = Depends(get_db)):
    return (
        db.query(OrganizationCategory)
        .filter(OrganizationCategory.is_deleted.is_(False))
        .all()
    )


@organization_router.post(
    "/create",
    response_model=OrganizationCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_organization(
    create_data: OrganizationCreateRequest, db: Session = Depends(get_db)
):
    try:
        exists = check_user_exists(
            db, create_data.owner_email, create_data.phone_number
        )
        if exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with the information exists. Please try logging in",
            )

        organization, owner = create_organization_service(create_data, db)
        return {
            "organization": {
                "id": organization.id,
                "name": organization.name,
                "abbreviation": organization.abbreviation,
                "address": organization.address,
            },
            "owner": {
                "id": owner.id,
                "email": owner.email,
                "full_name": owner.full_name,
            },
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error occurred: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred. Please try again.",
        )


@organization_router.get("/{organization_id}")
async def get_organization(
    organization_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Get organization details."""
    organization = (
        db.query(Organization)
        .filter(Organization.id == organization_id, Organization.is_deleted.is_(False))
        .first()
    )

    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found"
        )

    # Check if user belongs to this organization
    if current_user.organization_id != organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
        )

    return {
        "id": organization.id,
        "name": organization.name,
        "abbreviation": organization.abbreviation,
        "address": organization.address,
        "category_id": organization.category,
    }


@organization_router.put("/{organization_id}")
async def update_organization(
    organization_id: int,
    update_data: dict,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Update organization details."""
    organization = (
        db.query(Organization)
        .filter(Organization.id == organization_id, Organization.is_deleted.is_(False))
        .first()
    )

    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found"
        )

    # Check if user belongs to this organization and is owner
    if current_user.organization_id != organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
        )

    # Update fields
    for field, value in update_data.items():
        if hasattr(organization, field):
            setattr(organization, field, value)

    db.commit()

    return {
        "id": organization.id,
        "name": organization.name,
        "abbreviation": organization.abbreviation,
        "address": organization.address,
        "category_id": organization.category,
    }


@organization_router.delete("/{organization_id}")
async def delete_organization(
    organization_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Delete organization (soft delete)."""
    organization = (
        db.query(Organization)
        .filter(Organization.id == organization_id, Organization.is_deleted.is_(False))
        .first()
    )

    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found"
        )

    # Check if user belongs to this organization and is owner
    if current_user.organization_id != organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
        )

    # Soft delete
    organization.is_deleted = True
    db.commit()

    return {"message": "Organization deleted successfully"}
