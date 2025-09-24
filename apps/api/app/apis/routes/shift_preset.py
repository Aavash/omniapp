from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.config.database import get_db
from app.models.user import User
from app.utils.jwt import get_current_user
from app.apis.dtos.shift_preset import (
    GetShiftPresetGroupResponse,
    PaginatedShiftPresetGroupResponse,
    PopulateShiftsRequest,
    ShiftPresetCreateSchema,
    ShiftPresetEditSchema,
    ShiftPresetGroupCreateSchema,
    ShiftPresetGroupEditSchema,
    ShiftPresetGroupResponse,
    ShiftPresetResponse,
)
from app.apis.services.shift_preset import (
    create_shift_preset,
    create_shift_preset_group,
    delete_shift_preset_group,
    edit_shift_preset,
    delete_shift_preset,
    edit_shift_preset_group,
    get_shift_preset_group_by_id,
    get_shift_preset_group_response_by_id,
    list_shift_preset_groups,
    list_shift_presets,
    populate_shifts_for_days,
    populate_shifts_for_week,
)

shift_preset_router = APIRouter(prefix="/shift-preset", tags=["shift-preset"])


@shift_preset_router.post("/group/create", response_model=ShiftPresetGroupResponse)
def create_new_shift_preset_group(
    group_data: ShiftPresetGroupCreateSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        new_group = create_shift_preset_group(db, group_data, current_user)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
    return new_group


@shift_preset_router.put(
    "/group/edit/{group_id}", response_model=ShiftPresetGroupResponse
)
def update_shift_preset_group(
    group_id: int,
    group_data: ShiftPresetGroupEditSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        updated_group = edit_shift_preset_group(db, group_id, group_data, current_user)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
    return updated_group


@shift_preset_router.delete("/group/delete/{group_id}", response_model=dict)
def remove_shift_preset_group(
    group_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        result = delete_shift_preset_group(db, group_id, current_user)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
    return result


@shift_preset_router.get(
    "/group/list", response_model=PaginatedShiftPresetGroupResponse
)
def get_shift_preset_groups(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    worksite_id: Optional[int] = None,
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(10, le=100, description="Items per page"),
    search_query: Optional[str] = Query(None, description="Search query"),
    sort_by: Optional[str] = Query("id", description="Sort by column"),
    sort_order: Optional[str] = Query("asc", description="Sort order (asc/desc)"),
):
    try:
        # Fetch paginated groups
        groups, total_groups = list_shift_preset_groups(
            db,
            organization_id=current_user.organization_id,
            worksite_id=worksite_id,
            page=page,
            per_page=per_page,
            search_query=search_query,
            sort_by=sort_by,
            sort_order=sort_order,
        )

        # Calculate total pages
        total_pages = (total_groups + per_page - 1) // per_page

        # Prepare response
        response = PaginatedShiftPresetGroupResponse(
            groups=groups,
            total_groups=total_groups,
            total_pages=total_pages,
            current_page=page,
            per_page=per_page,
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
    return response


@shift_preset_router.get(
    "/group/{preset_group_id}", response_model=GetShiftPresetGroupResponse
)
def get_shift_preset_group(
    preset_group_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        preset_group = get_shift_preset_group_response_by_id(
            db, preset_group_id, current_user.organization_id
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
    return preset_group


@shift_preset_router.post("/create", response_model=ShiftPresetResponse)
def create_new_shift_preset(
    preset_data: ShiftPresetCreateSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        new_preset = create_shift_preset(db, preset_data, current_user)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
    return new_preset


@shift_preset_router.put("/edit/{preset_id}", response_model=ShiftPresetResponse)
def update_shift_preset(
    preset_id: int,
    preset_data: ShiftPresetEditSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        updated_preset = edit_shift_preset(db, preset_id, preset_data, current_user)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
    return updated_preset


@shift_preset_router.delete("/delete/{preset_id}", response_model=dict)
def remove_shift_preset(
    preset_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        result = delete_shift_preset(db, preset_id, current_user)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
    return result


@shift_preset_router.get(
    "/list/{shift_group_id}", response_model=List[ShiftPresetResponse]
)
def get_shift_presets(
    shift_group_id: int = Path(..., description="ID of the shift group to filter by"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    employee_id: Optional[int] = None,
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(10, le=100, description="Items per page"),
    search_query: Optional[str] = Query(None, description="Search query"),
    sort_by: Optional[str] = Query("id", description="Sort by column"),
    sort_order: Optional[str] = Query("asc", description="Sort order (asc/desc)"),
):
    try:
        presets = list_shift_presets(
            db,
            organization_id=current_user.organization_id,
            employee_id=employee_id,
            shift_group_id=shift_group_id,  # Pass the actual value
            page=page,
            per_page=per_page,
            search_query=search_query,
            sort_by=sort_by,
            sort_order=sort_order,
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
    return presets


@shift_preset_router.post(
    "/populate-shifts",
)
def populate_shifts_for_dates(
    request: PopulateShiftsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        group = get_shift_preset_group_by_id(
            db, request.preset_group_id, current_user.organization_id
        )
        presets = list_shift_presets(
            db,
            organization_id=current_user.organization_id,
            shift_group_id=request.preset_group_id,
            employee_id=request.employee_ids,
        )
        if request.apply_to_week:
            shifts = populate_shifts_for_week(
                db, current_user, request.dates[0], group.worksite_id, presets
            )
        else:
            shifts = populate_shifts_for_days(
                db, current_user, request.dates, group.worksite_id, presets
            )
        return shifts
    except Exception as e:
        db.rollback()
        print(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
