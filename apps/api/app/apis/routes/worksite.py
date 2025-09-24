from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.apis.dtos.worksite import (
    WorkSiteCreateSchema,
    WorkSiteEditSchema,
    WorkSiteResponse,
)
from app.apis.services.worksite import (
    create_worksite,
    edit_worksite,
    delete_worksite,
    get_worksite_by_id,
    list_worksites,
)
from app.models.user import User
from app.utils.jwt import get_current_user

worksite_router = APIRouter(prefix="/worksite", tags=["worksite"])


@worksite_router.post(
    "", response_model=WorkSiteResponse, status_code=status.HTTP_201_CREATED
)
def create_worksite_endpoint(
    worksite_data: WorkSiteCreateSchema,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    if not current_user.is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organization owners can create worksites",
        )

    try:
        new_worksite = create_worksite(db, worksite_data, current_user.organization_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    else:
        return new_worksite


@worksite_router.put("/{worksite_id}", response_model=WorkSiteResponse)
def edit_worksite_endpoint(
    worksite_id: int,
    worksite_data: WorkSiteEditSchema,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    existing_worksite = get_worksite_by_id(db, worksite_id)
    if existing_worksite.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid operation",
        )
    try:
        updated_worksite = edit_worksite(db, worksite_data, existing_worksite)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    else:
        return updated_worksite


@worksite_router.get("", response_model=List[WorkSiteResponse])
def list_worksites_endpoint(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(10, le=100, description="Items per page"),
    search_query: Optional[str] = Query(None, description="Search query"),
    sort_by: Optional[str] = Query("id", description="Sort by column"),
    sort_order: Optional[str] = Query("asc", description="Sort order (asc/desc)"),
):
    worksites = list_worksites(
        db,
        current_user.organization_id,
        page,
        per_page,
        search_query,
        sort_by,
        sort_order,
    )
    return worksites


@worksite_router.get("/{worksite_id}", response_model=WorkSiteResponse)
def get_worksite_endpoint(
    worksite_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    try:
        worksite = get_worksite_by_id(db, worksite_id)
        if worksite.organization_id != current_user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
            )
        return worksite
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Worksite not found"
        )


@worksite_router.delete("/{worksite_id}", response_model=dict)
def delete_worksite_endpoint(
    worksite_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    existing_worksite = get_worksite_by_id(db, worksite_id)
    if existing_worksite.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid delete request",
        )
    try:
        delete_worksite(db, existing_worksite)
    except:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while deleting the worksite",
        )
    return {"message": "WorkSite deleted successfully"}
