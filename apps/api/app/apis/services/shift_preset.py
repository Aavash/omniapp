from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy import and_, func
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.apis.dtos.shift_preset import (
    GetShiftPresetGroupResponse,
    ShiftPresetCreateSchema,
    ShiftPresetEditSchema,
    ShiftPresetGroupAnalytics,
    ShiftPresetGroupCreateSchema,
    ShiftPresetGroupEditSchema,
    ShiftPresetGroupListResponse,
)
from app.models.shift import Shift, ShiftPreset, ShiftPresetGroup
from app.models.user import User
from app.models.worksite import WorkSite


def get_shift_preset_group_by_id(
    db: Session, group_id: int, organization_id: int
) -> ShiftPresetGroup:
    group = db.query(ShiftPresetGroup).filter(ShiftPresetGroup.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Shift preset group not found"
        )
    if group.organization_id != organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only access groups in your organization",
        )
    return group


def get_shift_preset_group_response_by_id(
    db: Session, group_id: int, organization_id: int
) -> GetShiftPresetGroupResponse:
    # Query the ShiftPresetGroup and join with WorkSite to get the worksite_name
    group = (
        db.query(ShiftPresetGroup, WorkSite.name)
        .join(WorkSite, ShiftPresetGroup.worksite_id == WorkSite.id)
        .filter(ShiftPresetGroup.id == group_id)
        .first()
    )

    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Shift preset group not found"
        )

    # Unpack the result
    shift_preset_group, worksite_name = group

    if shift_preset_group.organization_id != organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only access groups in your organization",
        )

    # Construct the response object
    response = GetShiftPresetGroupResponse(
        id=shift_preset_group.id,
        title=shift_preset_group.title,
        organization_id=shift_preset_group.organization_id,
        worksite_id=shift_preset_group.worksite_id,
        worksite_name=worksite_name,
    )

    return response


def create_shift_preset_group(
    db: Session, group_data: ShiftPresetGroupCreateSchema, current_user: User
) -> ShiftPresetGroup:
    new_group = ShiftPresetGroup(
        title=group_data.title,
        worksite_id=group_data.worksite_id,
        organization_id=current_user.organization_id,
    )
    db.add(new_group)
    db.commit()
    db.refresh(new_group)
    return new_group


def edit_shift_preset_group(
    db: Session,
    group_id: int,
    group_data: ShiftPresetGroupEditSchema,
    current_user: User,
) -> ShiftPresetGroup:
    existing_group = get_shift_preset_group_by_id(
        db, group_id, current_user.organization_id
    )

    if group_data.title:
        existing_group.title = group_data.title
    if group_data.worksite_id:
        existing_group.worksite_id = group_data.worksite_id

    db.commit()
    db.refresh(existing_group)
    return existing_group


def delete_shift_preset_group(db: Session, group_id: int, current_user: User):
    existing_group = get_shift_preset_group_by_id(
        db, group_id, current_user.organization_id
    )
    db.delete(existing_group)
    db.commit()
    return {"message": "Shift preset group deleted successfully"}


def list_shift_preset_groups(
    db: Session,
    organization_id: int,
    worksite_id: Optional[int] = None,
    page: int = 1,
    per_page: int = 10,
    search_query: Optional[str] = None,
    sort_by: Optional[str] = "id",
    sort_order: Optional[str] = "asc",
):
    # Base query with join to WorkSite
    query = (
        db.query(ShiftPresetGroup, WorkSite.name.label("worksite_name"))
        .join(WorkSite, ShiftPresetGroup.worksite_id == WorkSite.id)
        .filter(ShiftPresetGroup.organization_id == organization_id)
    )

    # Apply filters
    if worksite_id:
        query = query.filter(ShiftPresetGroup.worksite_id == worksite_id)

    if search_query:
        query = query.filter(ShiftPresetGroup.title.ilike(f"%{search_query}%"))

    # Apply sorting
    if sort_by and hasattr(ShiftPresetGroup, sort_by):
        column = getattr(ShiftPresetGroup, sort_by)
        if sort_order == "desc":
            query = query.order_by(column.desc())
        else:
            query = query.order_by(column.asc())
    else:
        query = query.order_by(ShiftPresetGroup.id.asc())

    # Pagination
    total_groups = query.count()
    results = query.offset((page - 1) * per_page).limit(per_page).all()

    # Calculate analytics for each group
    enhanced_groups = []
    for group, worksite_name in results:
        # Calculate total shift hours (simplified for SQLite compatibility)
        presets = (
            db.query(ShiftPreset).filter(ShiftPreset.preset_group_id == group.id).all()
        )
        total_shift_hours = 0.0
        for preset in presets:
            try:
                start_hour, start_min = map(int, preset.shift_start.split(":"))
                end_hour, end_min = map(int, preset.shift_end.split(":"))
                start_minutes = start_hour * 60 + start_min
                end_minutes = end_hour * 60 + end_min
                if end_minutes > start_minutes:
                    total_shift_hours += (end_minutes - start_minutes) / 60.0
            except (ValueError, AttributeError):
                continue

        # Calculate total employees scheduled
        total_employees_scheduled = (
            db.query(func.count(ShiftPreset.employee_id.distinct()))
            .filter(ShiftPreset.preset_group_id == group.id)
            .scalar()
            or 0
        )

        # Add analytics to the group response
        enhanced_group = ShiftPresetGroupListResponse(
            id=group.id,
            title=group.title,
            worksite_id=group.worksite_id,
            worksite_name=worksite_name,  # Include worksite_name
            organization_id=group.organization_id,
            analytics=ShiftPresetGroupAnalytics(
                total_shift_hours=total_shift_hours,
                total_employees_scheduled=total_employees_scheduled,
            ),
        )
        enhanced_groups.append(enhanced_group)

    return enhanced_groups, total_groups


def get_shift_preset_by_id(
    db: Session, preset_id: int, organization_id: int
) -> ShiftPreset:
    preset = db.query(ShiftPreset).filter(ShiftPreset.id == preset_id).first()
    if not preset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Shift preset not found"
        )
    if preset.organization_id != organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only access presets in your organization",
        )
    return preset


def create_shift_preset(
    db: Session, preset_data: ShiftPresetCreateSchema, current_user: User
) -> ShiftPreset:
    new_preset = ShiftPreset(
        employee_id=preset_data.employee_id,
        title=preset_data.title,
        preset_group_id=preset_data.preset_group_id,
        organization_id=current_user.organization_id,
        day_of_week=preset_data.day_of_week,
        shift_start=preset_data.shift_start,
        shift_end=preset_data.shift_end,
        remarks=preset_data.remarks,
    )
    db.add(new_preset)
    db.commit()
    db.refresh(new_preset)
    return new_preset


def edit_shift_preset(
    db: Session, preset_id: int, preset_data: ShiftPresetEditSchema, current_user: User
) -> ShiftPreset:
    existing_preset = get_shift_preset_by_id(
        db, preset_id, current_user.organization_id
    )

    if preset_data.title:
        existing_preset.title = preset_data.title
    if preset_data.preset_group_id:
        existing_preset.preset_group_id = preset_data.preset_group_id
    if preset_data.day_of_week is not None:
        existing_preset.day_of_week = preset_data.day_of_week
    if preset_data.shift_start:
        existing_preset.shift_start = preset_data.shift_start
    if preset_data.shift_end:
        existing_preset.shift_end = preset_data.shift_end
    if preset_data.remarks is not None:
        existing_preset.remarks = preset_data.remarks

    db.commit()
    db.refresh(existing_preset)
    return existing_preset


def delete_shift_preset(db: Session, preset_id: int, current_user: User):
    existing_preset = get_shift_preset_by_id(
        db, preset_id, current_user.organization_id
    )
    db.delete(existing_preset)
    db.commit()
    return {"message": "Shift preset deleted successfully"}


def list_shift_presets(
    db: Session,
    organization_id: int,
    employee_id: Optional[int] = None,
    shift_group_id: Optional[int] = None,  # Ensure this is an int
    page: int = 1,
    per_page: int = 10,
    search_query: Optional[str] = None,
    sort_by: Optional[str] = "id",
    sort_order: Optional[str] = "asc",
):
    query = db.query(ShiftPreset).filter(ShiftPreset.organization_id == organization_id)

    # Apply filters
    if employee_id:
        query = query.filter(ShiftPreset.employee_id.in_(employee_id))

    if shift_group_id:
        query = query.filter(ShiftPreset.preset_group_id == shift_group_id)

    if search_query:
        query = query.filter(ShiftPreset.remarks.ilike(f"%{search_query}%"))

    # Apply sorting
    if sort_by and hasattr(ShiftPreset, sort_by):
        column = getattr(ShiftPreset, sort_by)
        if sort_order == "desc":
            query = query.order_by(column.desc())
        else:
            query = query.order_by(column.asc())
    else:
        query = query.order_by(ShiftPreset.id.asc())

    # Pagination
    return query.offset((page - 1) * per_page).limit(per_page).all()


def populate_shifts_for_week(
    db: Session,
    current_user: User,
    week_date: str,
    worksite_id: int,
    presets: List[ShiftPreset],
):
    start_date = datetime.strptime(week_date, "%Y-%m-%d")
    start_date = start_date - timedelta(days=start_date.isoweekday() % 7)
    end_date = start_date + timedelta(days=6)

    employee_ids = {preset.employee_id for preset in presets}
    existing_shifts = (
        db.query(Shift)
        .filter(
            and_(
                Shift.employee_id.in_(employee_ids),
                Shift.date >= start_date.strftime("%Y-%m-%d"),
                Shift.date <= end_date.strftime("%Y-%m-%d"),
            )
        )
        .all()
    )

    existing_shift_keys = {(shift.employee_id, shift.date) for shift in existing_shifts}
    shifts_to_add = []

    for day in range(7):
        current_date = start_date + timedelta(days=day)
        day_of_week = (current_date.isoweekday() % 7) + 1
        for preset in presets:
            if preset.day_of_week == day_of_week:
                if (
                    preset.employee_id,
                    current_date.strftime("%Y-%m-%d"),
                ) in existing_shift_keys:
                    continue

                shift = Shift(
                    employee_id=preset.employee_id,
                    title=preset.title,
                    worksite_id=worksite_id,
                    organization_id=current_user.organization_id,
                    date=current_date.strftime("%Y-%m-%d"),
                    shift_start=preset.shift_start,
                    shift_end=preset.shift_end,
                    remarks=preset.remarks,
                )
                shifts_to_add.append(shift)

    db.bulk_save_objects(shifts_to_add)
    db.commit()
    return shifts_to_add


def populate_shifts_for_days(
    db: Session,
    current_user: User,
    dates: List[str],
    worksite_id: int,
    presets: List[ShiftPreset],
):
    employee_ids = {preset.employee_id for preset in presets}
    existing_shifts = (
        db.query(Shift)
        .filter(
            and_(
                Shift.employee_id.in_(employee_ids),
                Shift.date.in_(dates),
            )
        )
        .all()
    )

    existing_shift_keys = {(shift.employee_id, shift.date) for shift in existing_shifts}
    shifts_to_add = []

    for date_str in dates:
        current_date = datetime.strptime(date_str, "%Y-%m-%d")
        day_of_week = (current_date.isoweekday() % 7) + 1

        for preset in presets:
            if preset.day_of_week == day_of_week:
                if (preset.employee_id, date_str) in existing_shift_keys:
                    continue

                shift = Shift(
                    employee_id=preset.employee_id,
                    title=preset.title,
                    worksite_id=worksite_id,
                    organization_id=current_user.organization_id,
                    date=date_str,
                    shift_start=preset.shift_start,
                    shift_end=preset.shift_end,
                    remarks=preset.remarks,
                )
                shifts_to_add.append(shift)

    db.bulk_save_objects(shifts_to_add)
    db.commit()
    return shifts_to_add
