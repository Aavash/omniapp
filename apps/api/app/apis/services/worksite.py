from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.worksite import WorkSite
from app.apis.dtos.worksite import WorkSiteCreateSchema, WorkSiteEditSchema


def get_worksite_by_id(db: Session, worksite_id: int) -> WorkSite | None:
    worksite = db.query(WorkSite).filter(WorkSite.id == worksite_id).first()
    if not worksite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="WorkSite not found"
        )
    return worksite


def create_worksite(
    db: Session, worksite_data: WorkSiteCreateSchema, organization_id: int
) -> WorkSite:
    new_worksite = WorkSite(
        name=worksite_data.name,
        address=worksite_data.address,
        city=worksite_data.city,
        state=worksite_data.state,
        zip_code=worksite_data.zip_code,
        contact_person=worksite_data.contact_person,
        contact_phone=worksite_data.contact_phone,
        status=worksite_data.status,
        organization_id=organization_id,
    )
    db.add(new_worksite)
    db.commit()
    db.refresh(new_worksite)
    return new_worksite


def edit_worksite(
    db: Session, worksite_data: WorkSiteEditSchema, existing_worksite: WorkSite
) -> WorkSite:
    if worksite_data.name:
        existing_worksite.name = worksite_data.name
    if worksite_data.address:
        existing_worksite.address = worksite_data.address
    if worksite_data.city:
        existing_worksite.city = worksite_data.city
    if worksite_data.state:
        existing_worksite.state = worksite_data.state
    if worksite_data.zip_code:
        existing_worksite.zip_code = worksite_data.zip_code
    if worksite_data.contact_person:
        existing_worksite.contact_person = worksite_data.contact_person
    if worksite_data.contact_phone:
        existing_worksite.contact_phone = worksite_data.contact_phone
    if worksite_data.status:
        existing_worksite.status = worksite_data.status

    db.commit()
    db.refresh(existing_worksite)
    return existing_worksite


def delete_worksite(db: Session, worksite: WorkSite):
    db.delete(worksite)
    db.commit()


def list_worksites(
    db: Session,
    organization_id: int,
    page: int = 1,
    per_page: int = 10,
    search_query: Optional[str] = None,
    sort_by: Optional[str] = "id",
    sort_order: Optional[str] = "asc",
):
    query = db.query(WorkSite).filter(WorkSite.organization_id == organization_id)

    if search_query:
        query = query.filter(
            WorkSite.name.ilike(f"%{search_query}%")
            | WorkSite.address.ilike(f"%{search_query}%")
            | WorkSite.city.ilike(f"%{search_query}%")
        )

    if sort_by and hasattr(WorkSite, sort_by):
        column = getattr(WorkSite, sort_by)
        if sort_order == "desc":
            query = query.order_by(column.desc())
        else:
            query = query.order_by(column.asc())
    else:
        query = query.order_by(WorkSite.id.asc())

    worksites = query.offset((page - 1) * per_page).limit(per_page).all()
    return worksites
