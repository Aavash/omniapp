from app.apis.routes.employee import employee_router
from app.apis.routes.expense import expense_router
from app.apis.routes.organization import organization_router
from app.apis.routes.auth import auth_router
from app.apis.routes.shift import shift_router
from app.apis.routes.shift_preset import shift_preset_router
from app.apis.routes.worksite import worksite_router
from app.apis.routes.employee_schedules import employee_user_router
from app.apis.routes.employee_punch import employee_punch_router
from app.apis.routes.summary import summary_router
from app.apis.routes.hourlists import employee_hours_router
from app.apis.routes.paymenthours import hours_router
from app.apis.routes.paymenthours import payslip_router
from app.apis.routes.employee_payslip_routes import employee_payslip_router
from app.apis.routes.employee_dashboard import employee_dashboard_router
from app.apis.routes.availability import availability_router

from fastapi import APIRouter

router = APIRouter(prefix="/api")

router.include_router(employee_router)
router.include_router(expense_router)
router.include_router(organization_router)
router.include_router(auth_router)
router.include_router(shift_router)
router.include_router(employee_user_router)
router.include_router(worksite_router)
router.include_router(shift_preset_router)
router.include_router(employee_punch_router)
router.include_router(summary_router)
router.include_router(employee_hours_router)
router.include_router(hours_router)
router.include_router(payslip_router)
router.include_router(employee_payslip_router)
router.include_router(employee_dashboard_router)
router.include_router(availability_router)
