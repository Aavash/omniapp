"""Model factory fixtures for creating test data."""

import pytest
from typing import Dict, Any
from sqlalchemy.orm import Session

from app.models.user import User, PayType, Availability
from app.models.organization import Organization, OrganizationCategory
from app.utils.password import get_password_hash


@pytest.fixture
def test_organization_category(db_session):
    """Create a test organization category."""
    category = OrganizationCategory(name="Technology")
    db_session.add(category)
    db_session.commit()
    db_session.refresh(category)
    return category


@pytest.fixture
def test_organization(db_session, test_organization_category):
    """Create a test organization."""
    organization = Organization(
        name="Test Company Inc.",
        abbreviation="TCI",
        address="123 Business Ave, Business City, BC 12345",
        category=test_organization_category.id,
    )
    db_session.add(organization)
    db_session.commit()
    db_session.refresh(organization)
    return organization


@pytest.fixture
def user_factory(db_session, test_organization):
    """Factory function for creating test users."""
    counter = 0

    def _create_user(
        full_name: str = "Test User",
        email: str = None,
        phone_number: str = None,
        phone_number_ext: str = "123",
        address: str = "123 Test St",
        pay_type: PayType = PayType.HOURLY,
        payrate: float = 15.00,
        is_owner: bool = False,
        is_active: bool = True,
        password: str = "testpassword123",
        **kwargs,
    ) -> User:
        nonlocal counter
        counter += 1

        # Generate unique email if not provided
        if email is None:
            email = f"test{counter}@example.com"

        # Generate unique phone number if not provided
        if phone_number is None:
            phone_number = f"{1000000000 + counter}"

        password_hash = get_password_hash(password)

        user_data = {
            "full_name": full_name,
            "email": email,
            "phone_number": phone_number,
            "phone_number_ext": phone_number_ext,
            "address": address,
            "pay_type": pay_type,
            "payrate": payrate,
            "is_owner": is_owner,
            "is_active": is_active,
            "password_hash": password_hash,
            "organization_id": test_organization.id,
            **kwargs,
        }

        user = User(**user_data)
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user

    return _create_user


@pytest.fixture
def organization_factory(db_session, test_organization_category):
    """Factory function for creating test organizations."""

    def _create_organization(
        name: str = "Test Organization",
        abbreviation: str = "TO",
        address: str = "123 Org Street",
        category_id: int = None,
        **kwargs,
    ) -> Organization:
        if category_id is None:
            category_id = test_organization_category.id

        org_data = {
            "name": name,
            "abbreviation": abbreviation,
            "address": address,
            "category": category_id,
            **kwargs,
        }

        organization = Organization(**org_data)
        db_session.add(organization)
        db_session.commit()
        db_session.refresh(organization)
        return organization

    return _create_organization


@pytest.fixture
def worksite_factory(db_session):
    """Factory function for creating test worksites."""

    def _create_worksite(
        name: str = "Test Worksite",
        address: str = "123 Work Street",
        city: str = "Work City",
        state: str = "WS",
        zip_code: str = "12345",
        contact_person: str = "Test Contact",
        contact_phone: str = "555-0123",
        status: str = "Active",
        organization_id: int = None,
        **kwargs,
    ):
        from app.models.worksite import WorkSite

        worksite_data = {
            "name": name,
            "address": address,
            "city": city,
            "state": state,
            "zip_code": zip_code,
            "contact_person": contact_person,
            "contact_phone": contact_phone,
            "status": status,
            "organization_id": organization_id,
            **kwargs,
        }

        worksite = WorkSite(**worksite_data)
        db_session.add(worksite)
        db_session.commit()
        db_session.refresh(worksite)
        return worksite

    return _create_worksite


@pytest.fixture
def test_worksite(worksite_factory, test_organization):
    """Create a test worksite."""
    return worksite_factory(organization_id=test_organization.id)


@pytest.fixture
def availability_factory(db_session):
    """Factory function for creating user availability."""

    def _create_availability(
        user_id: int,
        monday_available: bool = True,
        monday_start: str = "09:00",
        monday_end: str = "17:00",
        tuesday_available: bool = True,
        tuesday_start: str = "09:00",
        tuesday_end: str = "17:00",
        wednesday_available: bool = True,
        wednesday_start: str = "09:00",
        wednesday_end: str = "17:00",
        thursday_available: bool = True,
        thursday_start: str = "09:00",
        thursday_end: str = "17:00",
        friday_available: bool = True,
        friday_start: str = "09:00",
        friday_end: str = "17:00",
        saturday_available: bool = False,
        saturday_start: str = None,
        saturday_end: str = None,
        sunday_available: bool = False,
        sunday_start: str = None,
        sunday_end: str = None,
        notes: str = None,
        **kwargs,
    ) -> Availability:
        from datetime import time

        def parse_time(time_str):
            if time_str is None:
                return None
            hour, minute = map(int, time_str.split(":"))
            return time(hour, minute)

        availability_data = {
            "user_id": user_id,
            "monday_available": monday_available,
            "monday_start": parse_time(monday_start),
            "monday_end": parse_time(monday_end),
            "tuesday_available": tuesday_available,
            "tuesday_start": parse_time(tuesday_start),
            "tuesday_end": parse_time(tuesday_end),
            "wednesday_available": wednesday_available,
            "wednesday_start": parse_time(wednesday_start),
            "wednesday_end": parse_time(wednesday_end),
            "thursday_available": thursday_available,
            "thursday_start": parse_time(thursday_start),
            "thursday_end": parse_time(thursday_end),
            "friday_available": friday_available,
            "friday_start": parse_time(friday_start),
            "friday_end": parse_time(friday_end),
            "saturday_available": saturday_available,
            "saturday_start": parse_time(saturday_start),
            "saturday_end": parse_time(saturday_end),
            "sunday_available": sunday_available,
            "sunday_start": parse_time(sunday_start),
            "sunday_end": parse_time(sunday_end),
            "notes": notes,
            **kwargs,
        }

        availability = Availability(**availability_data)
        db_session.add(availability)
        db_session.commit()
        db_session.refresh(availability)
        return availability

    return _create_availability


# Parameterized fixtures for different test scenarios
@pytest.fixture(
    params=[
        {"pay_type": PayType.HOURLY, "payrate": 15.00},
        {"pay_type": PayType.MONTHLY, "payrate": 3000.00},
    ]
)
def user_with_different_pay_types(request, user_factory):
    """Create users with different pay types for parameterized testing."""
    return user_factory(**request.param)


@pytest.fixture(params=[True, False])
def user_with_different_owner_status(request, user_factory):
    """Create users with different owner status for parameterized testing."""
    email = f"{'owner' if request.param else 'employee'}@example.com"
    return user_factory(is_owner=request.param, email=email)
